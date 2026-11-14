import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './fonts.css';
import './index.css';
import { watchSafeArea } from './platform/native.ts';

watchSafeArea();

createRoot(document.getElementById('root')!).render(<App />);
