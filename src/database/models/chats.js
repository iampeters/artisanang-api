import { Schema, model } from 'mongoose';

const covidSchema = new Schema({ any: Object});


export const Global = model('Global', covidSchema, 'global');
export const Countries = model('Countries', covidSchema, 'countries');
// export const Countries = model('Countries', covidSchema, 'countries');

