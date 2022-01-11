const request = require('request');
const cheerio = require('cheerio');



function get_lyric(url) {
    return new Promise((resolve, reject) => {
        const options =   {
            url: url,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36 OPR/82.0.4227.50'
            }
          }
          console.log(options.url);
          request(options, (err, res, body) => {
            if (err) reject(err)
            const $ = cheerio.load(body);
            const lyrics = []
            const vers = $('div .Lyrics__Container-sc-1ynbvzw-6').contents().map(function() {
                return (this.type === 'text') ? $(this).text() + '\n ' : ' ';
             }).get().join(' ');
            // console.log(lyrics);
            // resolve(lyrics.join('\n\n'));
            resolve(vers)
        })
    })

}


function get_url(query) {
    return new Promise((resolve, reject) => {
        query = query.replaceAll(" ", "+")
        const options = {
            url: `https://genius.com/api/search/multi?per_page=5&q=${query}`,
            headers: { 
            'Cookie': '_genius_ab_test_cohort=78'
            }
        }
        request(options, (err, res) => {
            if (err) reject(err)
            data = JSON.parse(res.body)
            url = data.response.sections[1].hits[0].result.url
            // return
            
            resolve(url)
        })
    });
}


module.exports = {
    get_url: get_url,
    get_lyric: get_lyric
}