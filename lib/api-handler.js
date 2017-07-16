import request from 'request-promise';

const API = process.env.API || 'http://localhost:3000/api';
const API_KEY = process.env.KEY || 'P4VvNhswLY';
const APP_ID = process.env.APP_ID || 'gigq9uafg2r34g';

export default {
  getPosts(cb) {
    const options = {
      uri: API + '/posted/',
      headers: {
        access_key: API_KEY
      },
      json: true,
    }

    request(options)
      .then(posts => {
        cb(null, posts);
      })
      .catch(err => {
        cb(err, null);
      });
  },
  postPost({posted_id, username, skills, price_range, project}, cb) {
    const options = {
      method: 'POST',
      uri: API + '/posted/',
      headers: {
        access_key: API_KEY
      },
      body: {
        app_id: APP_ID,
        posted_id: posted_id,
        username: username,
        skills: skills,
        price_range: price_range,
        project: project,
      },
      json: true,
    };
    request(options)
      .then(data => {
        cb(null, data);
      })
      .catch(err => {
        cb(err, null);
      });
  },
  postUser(userName, first_name, last_name, profile_pic_url, cb) {
    const options = {
      method: 'POST',
      uri: API + '/users/',
      headers: {
        access_key: API_KEY
      },
      body: {
        app_id: APP_ID,
        username: userName,
        first_name: first_name,
        last_name: last_name,
        profile_pic_url: profile_pic_url,
      },
      json: true,
    };

    request(options)
      .then(data => {
        cb(null, data);
      })
      .catch(err => {
        cb(err, null);
      });
  },
}