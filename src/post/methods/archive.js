import { Status } from '../../constants/index.js';
import { transition } from './publish.js';

export default transition('archive', Status.Archived);
