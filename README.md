# QuanLi-BookingRes

Hệ thống quản lý booking đặt bàn, đặt món ăn tại nhà hàng.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, MongoDB (Mongoose), Socket.io, JWT |
| Frontend | React 18, Vite, Redux Toolkit, Tailwind CSS |
| Auth | JWT (access 15m, refresh 7d) |
| Real-time | Socket.io |

## Cấu trúc

```
backend/           # Node.js + Express + MongoDB
frontend/          # React + Vite + Tailwind
```

## Tài khoản test

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nhavien.com | admin123 |
| Shipper | shipper@nhavien.com | shipper123 |
| Customer | user1@nhavien.com | user1234 |

## Cài đặt

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install

# Seed dữ liệu
cd backend && npm run seed

# Chạy dev (từ root)
npm run dev
```


## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Chạy backend + frontend cùng lúc |
| `npm run lint` | ESLint cả frontend và backend |
| `npm run build` | Build frontend |

## License

MIT
netstat -ano | findstr :8080
taskkill /PID 4708 /F
