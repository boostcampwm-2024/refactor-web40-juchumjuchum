import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

export const useWebsocket = (socket: Socket) => {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
    };
  }, [socket]);

  return { isConnected };
};
