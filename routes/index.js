var express = require('express');
const validUrl = require('valid-url')
const shortid = require('shortid')
var router = express.Router();
const Url = require('../models/UrlModel')
const baseUrl = 'http:localhost:3000'
const connection = require('../config/db.config')
connection.once('open', () => console.log('DB Connected'))
connection.on('error', () => console.log('Error'))

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/shorten', async (req, res) => {
  const longUrl = req.body.content // destructure the longUrl from req.body.longUrl

  // check base url if valid using the validUrl.isUri method
  if (!validUrl.isUri(baseUrl)) {
      return res.status(401).json('Invalid base URL')
  }

  // if valid, we create the url code
  const urlCode = shortid.generate()

  // check long url if valid using the validUrl.isUri method
  if (validUrl.isUri(longUrl)) {
      try {
          /* The findOne() provides a match to only the subset of the documents 
          in the collection that match the query. In this case, before creating the short URL,
          we check if the long URL was in the DB ,else we create it.
          */
          let url = await Url.findOne({
              longUrl
          })

          // url exist and return the respose
          if (url) {
              res.send(url.shortUrl)
          } else {
              // join the generated short code the the base url
              const shortUrl = baseUrl + '/' + urlCode

              // invoking the Url model and saving to the DB
              url = new Url({
                  longUrl,
                  shortUrl,
                  urlCode,
                  date: new Date()
              })
              await url.save()
              res.send(url.shortUrl)
          }
      }
      // exception handler
      catch (err) {
          console.log(err)
          res.status(500).json('Server Error')
      }
  } else {
      res.status(401).json('Invalid longUrl')
  }
})

router.get('/:code', async (req, res) => {
  try {
      // find a document match to the code in req.params.code
      const url = await Url.findOne({
          urlCode: req.params.code
      })
      if (url) {
          // when valid we perform a redirect
          return res.redirect(url.longUrl)
      } else {
          // else return a not found 404 status
          return res.status(404).json('No URL Found')
      }

  }
  // exception handler
  catch (err) {
      console.error(err)
      res.status(500).json('Server Error')
  }
})


module.exports = router;
