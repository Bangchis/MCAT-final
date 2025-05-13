# api.R - Enhanced MHCAT Implementation
# -------------------------------------------------------------------------
library(plumber)
library(mirt)
library(jsonlite)

# Enable unboxed JSON
#* @plumber
function(pr) {
  pr %>% plumber::serializer_unboxed_json()
}

# ---- Enhanced Configuration ------------------------------------------------
MHCAT_CONFIG <- list(
  structure = c(1, 2),  # 2 stages: 1 panel -> 2 panels
  module_size = list(8, 6),  # 8 items stage 1, 6 items stage 2
  total_items = 30,
  max_cat_items = 16,  # 30 - (8 + 6) = 16 MCAT items
  min_SEM = 0.25,  # Slightly more lenient
  difficulty_bias = 0.3  # 30% bonus for harder items
)

# Item history file for preventing repetition
ITEM_HISTORY_FILE <- "item_history.json"

# ---- Load Model & Data -----------------------------------------------------
tryCatch({
  mod <- readRDS("../../data/irt_params/mirt_model.rds")
  
  # Get number of dimensions with better error handling
  if (!is.null(mod@Model) && !is.null(mod@Model$nfact)) {
    n_dim <- mod@Model$nfact
  } else if (!is.null(mod@nfact)) {
    n_dim <- mod@nfact
  } else {
    # Try alternative methods
    test_item <- extract.item(mod, 1)
    n_dim <- ncol(test_item@par) - 1
  }
  
  message(sprintf("Successfully loaded model with %d dimensions", n_dim))
  
}, error = function(e) {
  message("Error loading model: ", e$message)
  mod <- readRDS("../../data/irt_params/mirt_model.rds")
  n_dim <- 4  # Fallback
  message("Using fallback n_dim = 4")
})

# Load metadata
meta_df <- read.csv("../../data/metadata/result_final.csv", stringsAsFactors = FALSE)

# Safe access to model data
tryCatch({
  if (!is.null(mod@Data) && !is.null(mod@Data$data)) {
    valid_id <- colnames(mod@Data$data)
  } else {
    valid_id <- meta_df$QuestionId
  }
}, error = function(e) {
  valid_id <- meta_df$QuestionId
  message("Using metadata for valid_id")
})

meta_df <- meta_df[match(valid_id, meta_df$QuestionId), ]
correct_answers <- meta_df$CorrectAnswer
subject_ids     <- meta_df$SubjectId

# ---- Extract IRT Parameters -----------------------------------------------
tryCatch({
  coefs <- coef(mod, IRTpars = TRUE, simplify = FALSE)
  
  get_a <- function(m) {
    if (is.matrix(m)) {
      sapply(seq_len(n_dim), function(j) {
        nm <- paste0("a", j)
        if (nm %in% colnames(m)) as.numeric(m[1, nm]) else 0
      })
    } else if (is.vector(m)) {
      a_vals <- rep(0, n_dim)
      for (j in seq_len(n_dim)) {
        nm <- paste0("a", j)
        if (nm %in% names(m)) a_vals[j] <- as.numeric(m[nm])
      }
      a_vals
    } else {
      rep(0, n_dim)
    }
  }
  
  disc_mat <- t(vapply(coefs, get_a, numeric(n_dim)))
  
  b_vals <- sapply(coefs, function(m) {
    if (is.matrix(m) && "b" %in% colnames(m)) {
      as.numeric(m[1, "b"])
    } else if (is.vector(m) && "b" %in% names(m)) {
      as.numeric(m["b"])
    } else {
      NA_real_
    }
  })
  
  message(sprintf("Successfully extracted %d discrimination vectors and %d difficulty values", 
                  nrow(disc_mat), length(b_vals)))
  
}, error = function(e) {
  message("Error extracting parameters: ", e$message)
  stop("Cannot extract IRT parameters from model")
})

# ---- Enhanced Item History Functions --------------------------------------
load_item_history <- function() {
  if (file.exists(ITEM_HISTORY_FILE)) {
    tryCatch({
      return(fromJSON(ITEM_HISTORY_FILE))
    }, error = function(e) {
      message("Error loading item history: ", e$message)
      return(list())
    })
  }
  return(list())
}

save_item_history <- function(history) {
  tryCatch({
    write_json(history, ITEM_HISTORY_FILE, auto_unbox = TRUE)
  }, error = function(e) {
    message("Error saving item history: ", e$message)
  })
}

filter_recent_items <- function(available_items) {
  history <- load_item_history()
  
  # Only filter items from the immediately previous session
  # Not based on time, but on session sequence
  if (!is.null(history$last_session_items)) {
    old_length <- length(available_items)
    available_items <- setdiff(available_items, history$last_session_items)
    message(sprintf("Filtered %d items from previous session, %d remaining", 
                   old_length - length(available_items), 
                   length(available_items)))
  }
  
  return(available_items)
}

update_item_history <- function(session_items) {
  history <- load_item_history()
  
  # Store previous session as backup (for potential 3-session filtering)
  if (!is.null(history$last_session_items)) {
    history$previous_session_items <- history$last_session_items
    history$previous_session_time <- history$last_session_time
  }
  
  # Update with current session
  history$last_session_items <- session_items
  history$last_session_time <- Sys.time()
  
  save_item_history(history)
  message(sprintf("Updated item history with %d items", length(session_items)))
}

# ---- Enhanced 5-Level Difficulty Pools -----------------------------------
create_difficulty_pools <- function(disc_mat, b_vals, n_dim) {
  pools <- list()
  
  # For each dimension
  for (dim in seq_len(n_dim)) {
    # Find items with highest discrimination for this dimension
    dominant_dim <- apply(abs(disc_mat), 1, which.max)
    dim_items <- which(dominant_dim == dim)
    
    if (length(dim_items) == 0) next
    
    dim_b <- b_vals[dim_items]
    # Remove NAs
    valid_idx <- !is.na(dim_b)
    dim_items <- dim_items[valid_idx]
    dim_b <- dim_b[valid_idx]
    
    if (length(dim_items) == 0) next
    
    # 5 difficulty levels
    very_easy_idx <- dim_items[dim_b < -1.5]
    easy_idx <- dim_items[dim_b >= -1.5 & dim_b < -0.5]
    medium_idx <- dim_items[dim_b >= -0.5 & dim_b < 0.5]
    hard_idx <- dim_items[dim_b >= 0.5 & dim_b < 1.5]
    very_hard_idx <- dim_items[dim_b >= 1.5]
    
    if (length(very_easy_idx) > 0) pools[[paste0("dim", dim, "_very_easy")]] <- very_easy_idx
    if (length(easy_idx) > 0) pools[[paste0("dim", dim, "_easy")]] <- easy_idx
    if (length(medium_idx) > 0) pools[[paste0("dim", dim, "_medium")]] <- medium_idx
    if (length(hard_idx) > 0) pools[[paste0("dim", dim, "_hard")]] <- hard_idx
    if (length(very_hard_idx) > 0) pools[[paste0("dim", dim, "_very_hard")]] <- very_hard_idx
  }
  
  message(sprintf("Created %d difficulty pools across %d dimensions", length(pools), n_dim))
  return(pools)
}

# ---- Enhanced Module Assembly --------------------------------------------
assemble_modules_enhanced <- function(pools, n_dim, module_config) {
  modules <- list()
  structure <- module_config$structure
  module_sizes <- module_config$module_size
  
  # Collect all items
  all_items <- unlist(pools)
  if (length(all_items) == 0) {
    all_items <- seq_len(length(valid_id))
  }
  
  used_items <- integer(0)
  
  for (stage in seq_along(structure)) {
    n_panels <- structure[stage]
    module_size <- module_sizes[[stage]]
    
    for (panel in seq_len(n_panels)) {
      available <- setdiff(all_items, used_items)
      
      if (length(available) < module_size) {
        module_items <- available
      } else {
        # Enhanced selection with difficulty balance
        module_items <- integer(0)
        
        # For stage 1: balanced across all difficulties
        if (stage == 1) {
          # Try to get items from each difficulty level
          difficulty_levels <- c("very_easy", "easy", "medium", "hard", "very_hard")
          items_per_level <- max(1, floor(module_size / (n_dim * length(difficulty_levels))))
          
          for (dim in seq_len(n_dim)) {
            for (level in difficulty_levels) {
              pool_name <- paste0("dim", dim, "_", level)
              if (pool_name %in% names(pools)) {
                level_items <- intersect(pools[[pool_name]], available)
                if (length(level_items) > 0) {
                  selected <- sample(level_items, min(items_per_level, length(level_items)))
                  module_items <- c(module_items, selected)
                  available <- setdiff(available, selected)
                }
              }
            }
          }
        } else {
          # For stage 2+: route based on theta
          # This will be implemented in the /next endpoint
          # For now, use balanced selection
          items_per_dim <- max(1, floor(module_size / n_dim))
          
          for (dim in seq_len(n_dim)) {
            dim_pools <- pools[grepl(paste0("^dim", dim, "_"), names(pools))]
            dim_items <- unique(unlist(dim_pools))
            dim_available <- intersect(dim_items, available)
            
            if (length(dim_available) > 0) {
              selected <- sample(dim_available, min(items_per_dim, length(dim_available)))
              module_items <- c(module_items, selected)
              available <- setdiff(available, selected)
            }
          }
        }
        
        # Fill remaining slots if needed
        if (length(module_items) < module_size && length(available) > 0) {
          remaining <- sample(available, min(module_size - length(module_items), length(available)))
          module_items <- c(module_items, remaining)
        }
      }
      
      modules[[paste0("stage", stage, "_panel", panel)]] <- module_items
      used_items <- c(used_items, module_items)
      message(sprintf("Stage %d Panel %d: assembled %d items", stage, panel, length(module_items)))
    }
  }
  
  return(modules)
}

# ---- Enhanced Fisher Information Calculation ------------------------------
compute_fisher_info <- function(item_idx, theta, mod) {
  tryCatch({
    ii <- extract.item(mod, item_idx)
    I_j <- iteminfo(ii, Theta = matrix(theta, 1), multidim_matrix = TRUE)
    return(I_j)
  }, error = function(e) {
    message("Error computing Fisher info for item ", item_idx, ": ", e$message)
    return(matrix(0, length(theta), length(theta)))
  })
}

# ---- Enhanced Bayesian Optimality with Difficulty Bias -------------------
compute_difficulty_biased_optimality <- function(I_new, prior_cov_inv, item_idx, b_vals, bias_factor = 0.05) {
  tryCatch({
    # Base D-optimality
    base_value <- det(I_new + prior_cov_inv)
    
    # Difficulty bias: prefer harder items
    difficulty_score <- b_vals[item_idx]
    difficulty_weight <- 1 + bias_factor * pmax(0, difficulty_score)
    
    return(base_value * difficulty_weight)
  }, error = function(e) {
    message("Error computing biased D-optimality: ", e$message)
    return(0)
  })
}

# ---- Enhanced Theta Estimation with Stronger Updates ---------------------
estimate_theta_weighted <- function(administered, responses, mod) {
  tryCatch({
    # Create exponential weights for recent responses - stronger weights
    n_items <- length(administered)
    if (n_items == 0) return(rnorm(n_dim, 0, 0.5))
    
    # Stronger exponential weights: more recent responses have much higher weight
    weights <- exp(seq(-2, 0, length.out = n_items))  # Changed from -1 to -2
    
    # Prepare response pattern
    full_resp <- rep(NA_integer_, length(valid_id))
    full_resp[administered] <- responses
    rp_df <- setNames(as.data.frame(t(full_resp)), valid_id)
    
    # Use MAP estimation with much stronger prior for faster convergence
    theta_mat <- fscores(
      mod,
      response.pattern = rp_df,
      method = "MAP",  
      priorDist = "norm",
      priorPar = list(mean = 0, var = 2),  # Reduced from 4 to 2 for stronger updates
      QMC = TRUE,
      response.pattern.weights = weights,  # Apply weights directly
      TOL = 0.001,  # Tighter tolerance
      max.iter = 200  # More iterations for better convergence
    )
    
    # Apply additional smoothing based on number of items
    new_theta <- as.numeric(theta_mat[1, 1:n_dim])
    
    # Adaptive learning rate: stronger updates early in the test
    learning_rate <- min(0.5, 2 / sqrt(n_items))  # Starts at 0.5, decreases with more items
    
    # If we have previous theta (from session), blend with learning rate
    if (exists("sess") && !is.null(sess$theta)) {
      new_theta <- (1 - learning_rate) * sess$theta + learning_rate * new_theta
    }
    
    return(new_theta)
  }, error = function(e) {
    message("Error in weighted theta estimation: ", e$message)
    # More responsive fallback estimation
    full_resp <- rep(NA_integer_, length(valid_id))
    full_resp[administered] <- responses
    rp_df <- setNames(as.data.frame(t(full_resp)), valid_id)
    
    # Even fallback has stronger prior
    theta_mat <- fscores(mod, response.pattern = rp_df, method = "MAP", 
                        priorPar = list(mean = 0, var = 1.5))
    return(as.numeric(theta_mat[1, 1:n_dim]))
  })
}

# ---- Pre-assemble Modules --------------------------------------------------
message("Creating enhanced 5-level difficulty pools...")
difficulty_pools <- create_difficulty_pools(disc_mat, b_vals, n_dim)
message(sprintf("Created %d difficulty pools", length(difficulty_pools)))

message("Assembling enhanced modules...")
modules <- assemble_modules_enhanced(difficulty_pools, n_dim, MHCAT_CONFIG)
message(sprintf("Assembled %d modules", length(modules)))

# ---- Session Management ---------------------------------------------------
gen_id <- function(l = 16) paste0(sample(c(letters, LETTERS, 0:9), l, TRUE), collapse = "")
sessions <- new.env(parent = emptyenv())

# Utility functions
auto_scalar <- function(x) {
  if (length(x) == 1) return(x[[1]])
  x
}

safe_compute_info <- function(items, theta, mod) {
  I_total <- matrix(0, length(theta), length(theta))
  for (item in items) {
    I_j <- compute_fisher_info(item, theta, mod)
    I_total <- I_total + I_j
  }
  return(I_total)
}

# ---- Enhanced API Endpoints -----------------------------------------------

#* @post /start
#* @param theta0:list Optional numeric vector length = n_dim
function(req, theta0 = NULL) {
  theta0 <- if (is.null(theta0)) {
    rnorm(n_dim, mean = 0, sd = 0.5)
  } else {
    v <- as.numeric(unlist(theta0))
    if (length(v) != n_dim || anyNA(v))
      stop("theta0 must be a numeric vector of length n_dim", call. = FALSE)
    v
  }
  
  sid <- gen_id()
  message(sprintf("[START] session=%s theta0=%s", 
                  sid, paste(round(theta0,3), collapse=",")))
  
  # Initialize MMST phase
  sessions[[sid]] <- list(
    stage = "MMST",
    current_stage = 1,
    current_panel = 1,
    theta = theta0,
    administered = integer(0),
    responses = integer(0),
    user_answers = integer(0),  # Track actual user choices
    subjects = character(0),    # Track subjects for each question
    modules = modules,
    module_progress = 0,
    start_time = Sys.time()
  )
  
  # Get first module and apply history filter
  first_module <- modules[["stage1_panel1"]]
  available_items <- filter_recent_items(first_module)
  
  if (length(available_items) == 0) {
    # Fallback if all items filtered
    available_items <- first_module
    message("No available items after filtering, using original module")
  }
  
  first_item <- available_items[1]
  message(sprintf("[START] first item from MMST=%d", first_item))
  
  out <- list(
    session_id     = sid,
    stage          = "MMST",
    item_index     = first_item,
    question_id    = valid_id[first_item],
    discrimination = round(disc_mat[first_item, ], 3),
    difficulty     = round(b_vals[first_item], 3),
    category       = subject_ids[first_item],
    choices        = c("A","B","C","D"),
    correct_answer = correct_answers[first_item],
    theta          = round(theta0, 3)
  )
  
  # Convert to scalars
  for (key in c("session_id", "item_index", "question_id", "difficulty", "category", "correct_answer")) {
    out[[key]] <- auto_scalar(out[[key]])
  }
  
  out
}

#* @post /next
#* @param session_id
#* @param item_index  
#* @param answer integer 1–4 or letter A–D
#* @param elapsed_time:numeric Optional elapsed time in seconds
function(session_id, item_index, answer, elapsed_time = NULL) {
  sid <- auto_scalar(session_id)
  sess <- sessions[[sid]]
  if (is.null(sess)) stop("Invalid session_id", call.=FALSE)
  
  idx <- as.integer(auto_scalar(item_index))
  ans <- if (is.character(answer)) {
    match(toupper(answer), LETTERS[1:4])
  } else {
    as.integer(auto_scalar(answer))
  }
  if (is.na(ans) || !(ans %in% 1:4)) stop("answer must be 1-4", call.=FALSE)
  
  # Log timing data if provided
  if (!is.null(elapsed_time)) {
    message(sprintf("[NEXT] session=%s received item=%d answer=%d time=%.1fs", 
                    sid, idx, ans, as.numeric(elapsed_time)))
  } else {
    message(sprintf("[NEXT] session=%s received item=%d answer=%d", sid, idx, ans))
  }
  
  # 1) Record response
  score <- as.integer(ans == correct_answers[idx])
  sess$administered <- c(sess$administered, idx)
  sess$responses    <- c(sess$responses, score)
  sess$user_answers <- c(sess$user_answers, ans)
  sess$subjects     <- c(sess$subjects, subject_ids[idx])
  sess$module_progress <- sess$module_progress + 1
  
  # 2) Enhanced theta re-estimation
  sess$theta <- estimate_theta_weighted(sess$administered, sess$responses, mod)
  
  message(sprintf("  -> updated theta=%s", paste(round(sess$theta,3), collapse=",")))
  sessions[[sid]] <- sess
  
  # 3) MMST Phase Logic
  if (sess$stage == "MMST") {
    current_module_name <- paste0("stage", sess$current_stage, "_panel", sess$current_panel)
    current_module <- sess$modules[[current_module_name]]
    
    # Apply history filter to current module
    available_in_module <- filter_recent_items(current_module)
    if (length(available_in_module) == 0) {
      available_in_module <- current_module
    }
    
    # Check if current module is complete
    if (sess$module_progress < length(available_in_module)) {
      # More items in current module
      next_item <- available_in_module[sess$module_progress + 1]
      message(sprintf("  -> continuing module %s, item %d", current_module_name, next_item))
    } else {
      # Module complete, route to next
      sess$module_progress <- 0  # Reset for next module
      
      if (sess$current_stage < length(MHCAT_CONFIG$structure)) {
        # Enhanced routing for stage 2+ based on theta
        if (sess$current_stage == 1) {
          # Route to stage 2 based on average theta
          avg_theta <- mean(sess$theta)
          if (avg_theta < -0.5) {
            sess$current_panel <- 1  # Easier panel
          } else if (avg_theta > 0.5) {
            sess$current_panel <- 2  # Harder panel
          } else {
            sess$current_panel <- 1  # Start with easier panel
          }
          sess$current_stage <- 2
        } else {
          # For further stages, continue with adaptive routing
          sess$current_panel <- min(sess$current_panel + 1, MHCAT_CONFIG$structure[sess$current_stage])
        }
        
        sessions[[sid]] <- sess
        
        # Get first item from next module
        next_module_name <- paste0("stage", sess$current_stage, "_panel", sess$current_panel)
        if (next_module_name %in% names(sess$modules)) {
          next_module <- sess$modules[[next_module_name]]
          available_items <- filter_recent_items(next_module)
          if (length(available_items) == 0) available_items <- next_module
          next_item <- available_items[1]
          message(sprintf("  -> routing to %s, item %d", next_module_name, next_item))
        } else {
          # Move to MCAT phase
          sess$stage <- "MCAT"
          sessions[[sid]] <- sess
          message("  -> MMST complete, switching to MCAT")
          
          # Select first CAT item
          unseen <- setdiff(seq_along(valid_id), sess$administered)
          unseen <- filter_recent_items(unseen)
          if (length(unseen) == 0) {
            unseen <- setdiff(seq_along(valid_id), sess$administered)
          }
          
          if (length(unseen) > 0) {
            next_item <- unseen[1]  # Simple selection for first CAT item
          } else {
            next_item <- NA
          }
          
          if (is.na(next_item)) {
            # End session and save history
            update_item_history(sess$administered)
            
            out <- list(
              session_id = sid, 
              stage = sess$stage,
              theta = round(sess$theta, 3), 
              finished = TRUE,
              administered = sess$administered,
              responses = sess$responses,
              user_answers = sess$user_answers,
              subjects = sess$subjects,
              correct_answers = correct_answers[sess$administered]
            )
            out$finished <- auto_scalar(out$finished)
            out$session_id <- auto_scalar(out$session_id)
            out$stage <- auto_scalar(out$stage)
            return(out)
          }
          
          message(sprintf("  -> first CAT item=%d", next_item))
        }
      } else {
        # All MMST stages complete, switch to MCAT
        sess$stage <- "MCAT"
        sessions[[sid]] <- sess
        message("  -> MMST complete, switching to MCAT")
        
        # Select first CAT item
        unseen <- setdiff(seq_along(valid_id), sess$administered)
        unseen <- filter_recent_items(unseen)
        if (length(unseen) == 0) {
          unseen <- setdiff(seq_along(valid_id), sess$administered)
        }
        
        if (length(unseen) > 0) {
          next_item <- unseen[1]
        } else {
          next_item <- NA
        }
        
        if (is.na(next_item)) {
          # End session and save history
          update_item_history(sess$administered)
          
          out <- list(
            session_id = sid, 
            stage = sess$stage,
            theta = round(sess$theta, 3), 
            finished = TRUE,
            administered = sess$administered,
            responses = sess$responses,
            user_answers = sess$user_answers,
            subjects = sess$subjects,
            correct_answers = correct_answers[sess$administered]
          )
          out$finished <- auto_scalar(out$finished)
          out$session_id <- auto_scalar(out$session_id)
          out$stage <- auto_scalar(out$stage)
          return(out)
        }
        
        message(sprintf("  -> first CAT item=%d", next_item))
      }
    }
    
    # Return next item
    out <- list(
      session_id     = sid,
      stage          = sess$stage,
      item_index     = next_item,
      question_id    = valid_id[next_item],
      discrimination = round(disc_mat[next_item, ], 3),
      difficulty     = round(b_vals[next_item], 3),
      category       = subject_ids[next_item],
      choices        = c("A","B","C","D"),
      correct_answer = correct_answers[next_item],
      theta          = round(sess$theta, 3),
      finished       = FALSE
    )
  } else {
    # 4) Enhanced MCAT Phase Logic
    message("  -> in MCAT phase")
    
    # Compute total information
    I_total <- safe_compute_info(sess$administered, sess$theta, mod)
    
    # Check termination conditions
    n_mmst_items <- sum(lengths(sess$modules))
    if (length(sess$administered) >= MHCAT_CONFIG$total_items ||
        (length(sess$administered) - n_mmst_items) >= MHCAT_CONFIG$max_cat_items) {
      message("  -> reached max items")
      
      # End session and save history
      update_item_history(sess$administered)
      
      out <- list(
        session_id   = sid,
        stage        = sess$stage,
        theta        = round(sess$theta, 3),
        finished     = TRUE,
        administered = sess$administered,
        responses    = sess$responses,
        user_answers = sess$user_answers,
        subjects     = sess$subjects,
        correct_answers = correct_answers[sess$administered]
      )
      out$finished <- auto_scalar(out$finished)
      return(out)
    }
    
    # Check SEM termination
    prior_cov_inv <- diag(n_dim)
    tryCatch({
      cov_theta <- solve(I_total + prior_cov_inv)
      SEMs <- sqrt(diag(cov_theta))
      if (all(SEMs < MHCAT_CONFIG$min_SEM, na.rm = TRUE)) {
        message("  -> SEM condition met")
        
        # End session and save history
        update_item_history(sess$administered)
        
        out <- list(
          session_id = sid, 
          stage = sess$stage,
          theta = round(sess$theta, 3), 
          finished = TRUE,
          administered = sess$administered,
          responses = sess$responses,
          user_answers = sess$user_answers,
          subjects = sess$subjects,
          correct_answers = correct_answers[sess$administered]
        )
        out$finished <- auto_scalar(out$finished)
        out$session_id <- auto_scalar(out$session_id)
        out$stage <- auto_scalar(out$stage)
        return(out)
      }
    }, error = function(e) {
      message("Error checking SEM: ", e$message)
    })
    
    # Enhanced item selection with difficulty bias
    unseen <- setdiff(seq_along(valid_id), sess$administered)
    unseen <- filter_recent_items(unseen)
    
    if (length(unseen) == 0) {
      # Try without history filter if needed
      unseen <- setdiff(seq_along(valid_id), sess$administered)
    }
    
    if (length(unseen) == 0) {
      message("  -> no more items available")
      
      # End session and save history
      update_item_history(sess$administered)
      
      out <- list(
        session_id = sid, 
        stage = sess$stage,
        theta = round(sess$theta, 3), 
        finished = TRUE,
        administered = sess$administered,
        responses = sess$responses,
        user_answers = sess$user_answers,
        subjects = sess$subjects,
        correct_answers = correct_answers[sess$administered]
      )
      out$finished <- auto_scalar(out$finished)
      return(out)
    }
    
    # Find best item using enhanced D-optimality with difficulty bias
    best_item <- NA
    best_value <- -Inf
    
    for (item in unseen) {
      I_j <- compute_fisher_info(item, sess$theta, mod)
      I_new <- I_total + I_j
      value <- compute_difficulty_biased_optimality(I_new, prior_cov_inv, item, b_vals, MHCAT_CONFIG$difficulty_bias)
      
      if (value > best_value) {
        best_value <- value
        best_item <- item
      }
    }
    
    if (is.na(best_item)) {
      message("  -> no suitable item found")
      
      # End session and save history  
      update_item_history(sess$administered)
      
      out <- list(
        session_id = sid, 
        stage = sess$stage,
        theta = round(sess$theta, 3), 
        finished = TRUE,
        administered = sess$administered,
        responses = sess$responses,
        user_answers = sess$user_answers,
        subjects = sess$subjects,
        correct_answers = correct_answers[sess$administered]
      )
      out$finished <- auto_scalar(out$finished)
      return(out)
    }
    
    message(sprintf("  -> next CAT item=%d (difficulty=%.3f)", best_item, b_vals[best_item]))
    
    out <- list(
      session_id     = sid,
      stage          = sess$stage,
      item_index     = best_item,
      question_id    = valid_id[best_item],
      discrimination = round(disc_mat[best_item, ], 3),
      difficulty     = round(b_vals[best_item], 3),
      category       = subject_ids[best_item],
      choices        = c("A","B","C","D"),
      correct_answer = correct_answers[best_item],
      theta          = round(sess$theta, 3),
      finished       = FALSE
    )
  }
  
  # Convert to scalars
  out$item_index  <- auto_scalar(out$item_index)
  out$question_id <- auto_scalar(out$question_id)
  out$finished    <- auto_scalar(out$finished)
  
  # Enhanced logging output
  cat("\n========== Next Question ==========\n")
  cat(sprintf("Session ID     : %s\n", out$session_id))
  cat(sprintf("Stage          : %s\n", out$stage))
  cat(sprintf("Item index     : %d\n", out$item_index))
  cat(sprintf("Question ID    : %s\n", out$question_id))
  cat(sprintf("Discrimination : %s\n", paste(out$discrimination, collapse = ", ")))
  cat(sprintf("Difficulty     : %.3f\n", out$difficulty))
  cat(sprintf("Category       : %s\n", out$category))
  cat(sprintf("Choices        : %s\n", paste(out$choices, collapse = " / ")))
  cat(sprintf("Correct answer : %s\n", out$correct_answer))
  cat(sprintf("Current theta  : %s\n", paste(out$theta, collapse = ", ")))
  cat(sprintf("Items done     : %d/%d\n", length(sess$administered), MHCAT_CONFIG$total_items))
  cat(sprintf("Finished       : %s\n", out$finished))
  cat("===================================\n\n")
  
  out
}

# ---- Session Cleanup Endpoint ---------------------------------------------
#* @post /session-end
#* @param session_id
#* @param total_time:numeric Optional total time in seconds
function(session_id, total_time = NULL) {
  sid <- auto_scalar(session_id)
  sess <- sessions[[sid]]
  if (!is.null(sess)) {
    # Save item history
    update_item_history(sess$administered)
    
    # Log timing information if provided
    if (!is.null(total_time)) {
      avg_time_per_question <- as.numeric(total_time) / length(sess$administered)
      message(sprintf("[SESSION_END] session=%s total_time=%.1fs avg_per_question=%.1fs", 
                      sid, as.numeric(total_time), avg_time_per_question))
    } else {
      message(sprintf("[SESSION_END] session=%s (no timing data)", sid))
    }
    
    # Clean up session
    rm(list = sid, envir = sessions)
    message(sprintf("[SESSION_END] Cleaned up session %s", sid))
  }
  list(status = "success")
}