# s3-bucket

AWS S3 Bucket 連線測試工具

## 功能

- 透過網頁介面連接到 AWS S3
- 測試連線並顯示成功或失敗狀態
- 列出所有可用的 S3 Buckets

## 安裝

```bash
npm install
```

## 使用方式

1. 啟動伺服器：
```bash
npm start
```

2. 開啟瀏覽器訪問：
```
http://localhost:3000
```

3. 輸入你的 AWS 憑證：
   - Access Key ID
   - Secret Access Key
   - Region

4. 點擊「測試連線」按鈕

## 開發模式

```bash
npm run dev
```

## 注意事項

- 請勿將 AWS 憑證提交到 Git
- 建議使用 IAM 用戶並給予最小權限
- 此工具僅用於測試連線，請勿在生產環境使用
