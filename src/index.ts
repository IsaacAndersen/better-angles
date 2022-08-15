import * as _ from 'lodash';
import './styles.scss';
import { animate } from './scripts/rotationEditor';

const styleSheet = document.createElement('link');
styleSheet.rel = 'stylesheet';
styleSheet.href = 'https://unpkg.com/mvp.css';
document.head.appendChild(styleSheet);

animate();