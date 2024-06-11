/// <reference types="node" />

import { EventEmitter } from 'events';

export interface Code {
  [key: number]: number;
}

export interface AverageOptions {
  tolerance?: number;
}

export function average(codes: Code[], options?: AverageOptions): Code;

export interface ListenOptions {
  maxWidth?: number;
  minWidth?: number;
}

export class Listener extends EventEmitter {
  addListener(eventName: 'data', listener: (code: Code) => void | Promise<void>): this;
  listeners(eventName: 'data'): ((code: Code) => void | Promise<void>)[];
  off(eventName: 'data', listener: (code: Code) => void | Promise<void>): this;
  on(eventName: 'data', listener: (code: Code) => void | Promise<void>): this;
  once(eventName: 'data', listener: (code: Code) => void | Promise<void>): this;
  prependListener(eventName: 'data', listener: (code: Code) => void | Promise<void>): this;
  prependOnceListener(eventName: 'data', listener: (code: Code) => void | Promise<void>): this;
  removeListener(eventName: 'data', listener: (code: Code) => void | Promise<void>): this;
  rawListeners(eventName: 'data'): ((code: Code) => void | Promise<void>)[];
}

export function listen(gpio: number, options?: ListenOptions): Listener;

export interface RecordOptions {
  averageOptions?: AverageOptions;
  confirm?: number;
  listenOptions?: ListenOptions;
  minLength?: number;
}

export function record(gpio: number, options?: RecordOptions): Promise<Code>;

export interface SendOptions {
  frequency?: number;
  interval?: number;
}

export function send(gpio: number, codeOrCodes: Code | Code[], options?: SendOptions): Promise<void>;
