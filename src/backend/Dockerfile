FROM python:3.10-slim

# Cài đặt R và các gói cần thiết sử dụng apt-get
# apt-get update: Cập nhật danh sách các gói phần mềm
# apt-get install -y r-base: Cài đặt gói R cơ bản (-y để tự động đồng ý)
# rm -rf /var/lib/apt/lists/*: Dọn dẹp cache của apt để giảm kích thước Image
RUN apt-get update && apt-get install -y r-base && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./

# Bây giờ rpy2 sẽ tìm thấy R khi cài đặt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["python", "app.py"]