// filepath: /mnt/e/cs50web/MCAT/src/r_service/Dockerfile
FROM rocker/r-ver:4.2.0
RUN R -e "install.packages('plumber', repos='https://cloud.r-project.org')"
WORKDIR /app
COPY . .
EXPOSE 8000
CMD ["Rscript", "-e", "pr <- plumber::plumb('api.R'); pr$run(host='0.0.0.0', port=8000)"]