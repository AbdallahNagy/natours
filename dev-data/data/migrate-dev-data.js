const dotenv = require('dotenv');
dotenv.config({ path: './../../config.env' });

const Tour = require('../../models/tourModel');
const fs = require('fs');
const mongoose = require('mongoose');

mongoose.connect(process.env.LOCAL_CONNECTION_STRING)
    .then(() => {
        console.log('database connected successfully');
    })
    .catch(err => {
        console.error('database connection error:', err);
    });


const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

let counter = 1;
tours.forEach(async tour => {
    await Tour.create(tour);

    console.log(counter++ + ' file created');
});