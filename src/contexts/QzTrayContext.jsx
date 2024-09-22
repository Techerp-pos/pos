// src/contexts/QZTrayContext.js
import React, { createContext, useState, useEffect } from 'react';
import qz from 'qz-tray';

export const QZTrayContext = createContext();

export const QZTrayProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [availablePrinters, setAvailablePrinters] = useState([]);

    const connectToQZTray = async () => {
        if (qz.websocket.isActive()) {
            setIsConnected(true);
            return;
        }

        try {
            setIsConnecting(true);
            await qz.websocket.connect();
            setIsConnected(true);
            console.log("Connected to QZ Tray");
            detectPrinters();
        } catch (err) {
            console.error("Error connecting to QZ Tray:", err);
            setTimeout(connectToQZTray, 5000); // Retry after 5 seconds
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectQZTray = async () => {
        if (qz.websocket.isActive()) {
            try {
                await qz.websocket.disconnect();
                setIsConnected(false);
                console.log("Disconnected from QZ Tray");
            } catch (err) {
                console.error("Error disconnecting from QZ Tray:", err);
            }
        }
    };

    const detectPrinters = async () => {
        try {
            const printers = await qz.printers.find();
            setAvailablePrinters(printers);
            console.log("Available Printers:", printers);
        } catch (err) {
            console.error("Error detecting printers:", err);
        }
    };

    useEffect(() => {
        connectToQZTray();

        // Clean up on unmount
        return () => {
            disconnectQZTray();
        };
    }, []);

    return (
        <QZTrayContext.Provider value={{ isConnected, isConnecting, availablePrinters, detectPrinters }}>
            {children}
        </QZTrayContext.Provider>
    );
};
