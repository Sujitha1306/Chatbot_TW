import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { connect, MqttClient } from 'mqtt';

export interface IMqttMessage {
    topic: string;
    payload: any;
}

export interface MqttConnectionOptions {
    hostname: string;
    port: number;
    path?: string;
    username?: string;
    password?: string;
    protocol?: 'ws' | 'wss';
}

@Injectable({
    providedIn: 'root'
})
export class MqttService implements OnDestroy {
    private client: MqttClient | null = null;
    private messageSubject = new Subject<IMqttMessage>();
    private connectionStateSubject = new Subject<boolean>();

    public messages$: Observable<IMqttMessage> = this.messageSubject.asObservable();
    public isConnected$: Observable<boolean> = this.connectionStateSubject.asObservable();

    constructor() { }

    /**
     * Connect to the MQTT broker via WebSockets
     */
    public connect(options: MqttConnectionOptions): void {
        if (this.client?.connected) {
            console.warn('MQTT Client already connected');
            return;
        }

        const protocol = options.protocol || 'wss';
        const url = `${protocol}://${options.hostname}:${options.port}${options.path || ''}`;

        console.log(`Connecting to MQTT Broker at ${url}...`);

        this.client = connect(url, {
            username: options.username,
            password: options.password,
            clientId: `trackerwave_web_${Math.random().toString(16).substr(2, 8)}`,
            keepalive: 60,
            reconnectPeriod: 5000, // Auto-reconnect every 5 seconds
            clean: true
        });

        this.client.on('connect', () => {
            console.log('✅ MQTT Connected');
            this.connectionStateSubject.next(true);
        });

        this.client.on('message', (topic: string, payload: Buffer) => {
            try {
                const messageStr = payload.toString();
                const parsedPayload = JSON.parse(messageStr);
                this.messageSubject.next({ topic, payload: parsedPayload });
            } catch (err) {
                console.warn('Failed to parse MQTT message payload', err);
            }
        });

        this.client.on('error', (err) => {
            console.error('MQTT Connection Error:', err);
            this.connectionStateSubject.next(false);
        });

        this.client.on('offline', () => {
            console.warn('MQTT Client Offline');
            this.connectionStateSubject.next(false);
        });

        this.client.on('reconnect', () => {
            console.log('MQTT Reconnecting...');
        });
    }

    /**
     * Subscribe to a topic
     */
    public subscribe(topic: string): void {
        if (this.client) {
            this.client.subscribe(topic, (err) => {
                if (err) {
                    console.error(`Failed to subscribe to ${topic}`, err);
                } else {
                    console.log(`Subscribed to ${topic}`);
                }
            });
        }
    }

    /**
     * Unsubscribe from a topic
     */
    public unsubscribe(topic: string): void {
        if (this.client) {
            this.client.unsubscribe(topic);
        }
    }

    /**
     * Publish a message to a topic
     */
    public publish(topic: string, payload: any): void {
        if (this.client && this.client.connected) {
            const message = typeof payload === 'object' ? JSON.stringify(payload) : payload.toString();
            this.client.publish(topic, message);
        } else {
            console.warn('Cannot publish, MQTT client not connected');
        }
    }

    /**
     * Disconnect cleanly
     */
    public disconnect(): void {
        if (this.client) {
            console.log('Disconnecting MQTT Client...');
            this.client.end();
            this.client = null;
            this.connectionStateSubject.next(false);
        }
    }

    ngOnDestroy(): void {
        this.disconnect();
    }
}
