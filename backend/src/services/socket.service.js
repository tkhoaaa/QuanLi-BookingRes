let io = null;

const setupSocket = (server) => {
  const { Server } = require("socket.io");
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("join", (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    socket.on("leave", (userId) => {
      if (userId) {
        socket.leave(`user:${userId}`);
      }
    });

    // Aliases for frontend compatibility
    socket.on("joinRoom", (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on("leaveRoom", (userId) => {
      if (userId) socket.leave(`user:${userId}`);
    });

    socket.on("joinAdminRoom", () => {
      socket.join("admin");
    });

    socket.on("joinShipperRoom", () => {
      socket.join("shipper");
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

const joinRoom = (userId) => {
  if (io && userId) {
    // Returns a function to join in a specific socket context
    return `user:${userId}`;
  }
};

const leaveRoom = (userId) => {
  if (io && userId) {
    return `user:${userId}`;
  }
};

const emitToUser = (userId, event, data) => {
  if (io && userId) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const emitToRoom = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};

const emitToAdmins = (event, data) => {
  if (io) {
    io.to("admin").emit(event, data);
  }
};

const emitToShippers = (event, data) => {
  if (io) {
    io.to("shipper").emit(event, data);
  }
};

module.exports = {
  setupSocket,
  getIO,
  joinRoom,
  leaveRoom,
  emitToUser,
  emitToRoom,
  emitToAdmins,
  emitToShippers,
};
