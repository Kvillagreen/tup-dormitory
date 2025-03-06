declare module 'qrcode.react' {
    import { Component } from 'react';

    interface QRCodeProps {
        value: string;
        size?: number;
        level?: 'L' | 'M' | 'Q' | 'H';
        includeMargin?: boolean;
        className?: string;
    }

    export default class QRCode extends Component<QRCodeProps> { }
}