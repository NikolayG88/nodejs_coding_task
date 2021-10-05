import { HOSTNAME } from './constants.js';
import https from 'https';

class HttpService {
  GetRequest(url) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: HOSTNAME,
        port: 443,
        path: `https://${HOSTNAME}/${url}`,
        method: 'GET'
      }

      const req = https.request(options, res => {
        res.on('data', buffer => {
          const dataJson = buffer.toString('utf8');
          resolve(JSON.parse(dataJson));
        });
      });

      req.on('error', error => {
        reject(error)
      });

      req.end();
    });
  }
}

export default HttpService;
