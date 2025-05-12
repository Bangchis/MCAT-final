#!/usr/bin/env Rscript
# src/calibration/calibrate_model.R
# Calibrate M2PL (4 chiều) cho 4 skills,
# loại bỏ những item có <50 phản hồi, và dừng sau tối đa 100 vòng EM

library(mirt)

# --- 1. Đường dẫn ---
resp_path <- "../../data/responses_neurips.csv"
meta_path <- "../../data/metadata/result_final.csv"
out_dir   <- "../../data/irt_params"
out_file  <- file.path(out_dir, "mirt_model.rds")

# --- 2. Load và sort ma trận phản hồi ---
resp <- read.csv(resp_path, row.names="UserId", check.names=FALSE)
resp <- resp[, order(as.integer(colnames(resp)))]

# --- 3. Lọc item thiếu data (<50 phản hồi) ---
resp_counts <- colSums(!is.na(resp))
active_q    <- names(resp_counts[resp_counts >= 50])
drop_q      <- setdiff(colnames(resp), active_q)

cat("🔹 Tổng item ban đầu:", ncol(resp), "\n")
cat("🔹 Item đủ >=50 phản hồi:", length(active_q), "\n")
cat("🔹 Item bị loại (<50 phản hồi):", length(drop_q), "\n")

resp <- resp[, active_q]

# --- 4. Load metadata và giữ match với active_q ---
meta <- read.csv(meta_path, stringsAsFactors=FALSE)
meta <- meta[meta$QuestionId %in% active_q, ]

missing <- setdiff(active_q, as.character(meta$QuestionId))
if(length(missing)>0) stop("Thiếu metadata cho QIDs: ", paste(missing, collapse=", "))

# --- 5. Định nghĩa mapping cho factors ---
factor_names <- c("Algebra", "Arithmetic", "Geometry", "Number")

# --- 6. Gom index cột cho mỗi factor ---
model_list <- setNames(vector("list", length(factor_names)), factor_names)
for(i in seq_along(factor_names)){
  sid  <- i - 1L
  qids <- meta$QuestionId[meta$SubjectId == sid]
  idx  <- match(as.character(qids), colnames(resp))
  if(any(is.na(idx))) stop("Chưa match được QIDs cho SubjectId=", sid)
  model_list[[ factor_names[i] ]] <- idx
}

# --- 7. Chuyển sang cú pháp mirt.model() ---
model_spec <- mirt.model(
  paste0(factor_names, " = ",
         sapply(model_list, function(idx) paste(idx, collapse = ",")),
         collapse = "\n")
)

# --- 8. Calibrate M2PL đa chiều, dừng sau tối đa 100 vòng EM ---
mod <- mirt(
  resp,
  model    = model_spec,
  itemtype = "2PL",
  method   = "QMCEM",
  technical = list(NCYCLES = 100),
  verbose  = TRUE
)

# --- 9. Lưu model ---
if(!dir.exists(out_dir)) dir.create(out_dir, recursive=TRUE)
saveRDS(mod, out_file)
cat("✅ Calibration hoàn thành (<=100 vòng EM)! Model lưu tại", out_file, "\n")
