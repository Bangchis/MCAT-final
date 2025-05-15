FROM rocker/r-ver:4.2.0

# Cài thêm dependency hệ thống
RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    libsodium-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libfreetype6-dev \
    libpng-dev \
    libtiff5-dev \
    libjpeg-dev

# Cài plumber + kiểm tra rõ ràng lỗi (nếu có)
# RUN R -e "install.packages(c('plumber'), repos='https://cloud.r-project.org')"
RUN R -e "install.packages(c('plumber', 'mirt'), repos='https://cloud.r-project.org')"

WORKDIR /app
COPY . .
EXPOSE 8000

CMD ["Rscript", "-e", "pr <- plumber::plumb('api.R'); pr$run(host='0.0.0.0', port=8000)"]
