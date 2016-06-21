/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express  = require('express'),
  app        = express(),
  watson     = require('watson-developer-cloud'),
  RateLimit  = require('express-rate-limit');

 app.enable('trust proxy');

 var translateLimiter = RateLimit({
   windowMs: 60 * 1000,
   delayMs: 1,
   max: 10,
   global: false
 });

 var identifyLimiter = RateLimit({
   windowMs: 60 * 1000,
   delayMs: 1,
   max: 10,
   global: false
 });

// Bootstrap application settings
require('./config/express')(app);

var language_translation = watson.language_translation({
  username: '<username>',
  password: '<password>',
  version: 'v2'
});

// render index page
app.get('/', function(req, res) {
  res.render('index');
});

app.get('/api/models', function(req, res, next) {
  console.log('/v2/models');
  language_translation.getModels({}, function(err, models) {
    if (err)
      return next(err);
    else
      res.json(models);
  });
});

app.post('/api/identify', identifyLimiter, function(req, res, next) {
  console.log('/v2/identify');
  var params = {
    text: req.body.textData,
    'X-WDC-PL-OPT-OUT': req.header('X-WDC-PL-OPT-OUT')
  };
  language_translation.identify(params, function(err, models) {
      if (err)
        return next(err);
      else
        res.json(models);
  });
});

app.get('/api/identifiable_languages', function(req, res, next) {
  console.log('/v2/identifiable_languages');
  language_translation.getIdentifiableLanguages({}, function(err, models) {
    if (err)
      return next(err);
    else
      res.json(models);
  });
});

app.post('/api/translate', translateLimiter,  function(req, res, next) {
  console.log('/v2/translate');
  var params = extend({ 'X-WDC-PL-OPT-OUT': req.header('X-WDC-PL-OPT-OUT')}, req.body);
  language_translation.translate(params, function(err, models) {
    if (err)
      return next(err);
    else
      res.json(models);
  });
});

// express error handler
require('./config/error-handler')(app);

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);
