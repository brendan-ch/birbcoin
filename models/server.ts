import mongoose from 'mongoose';
import { IServer } from '../typedefs';

const Server = new mongoose.Schema({
  prefix: String,
  serverId: String,
  disabledCommands: Array,
});

export default mongoose.model<IServer>('server', Server);