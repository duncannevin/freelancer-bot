import request from 'request-promise';

const API = process.env.API || 'http://localhost:3000/api';
const API_KEY = process.env.KEY || 'P4VvNhswLY';
const APP_ID = process.env.APP_ID || 'gigdt4l97v0qksyixfr2rly';

const HEADERS = {
  access_key: API_KEY,
  app_id: APP_ID,
}

export default {
  getUser(username, cb) {
    const options = {
      uri: API + '/users/' + username,
      headers: HEADERS,
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

  getPosts(query, type, cb) {
    const route = '/' + query + '/' + type + '/';

    const options = {
      uri: API + '/posted/query' + route,
      headers: HEADERS,
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

  getPost(posted_id, cb) {
    const options = {
      uri: API + '/posted/getbypostid/' + posted_id,
      headers: HEADERS,
      json: true,
    };

    request(options)
      .then(post => {
        cb(null, post);
      })
      .catch(err => {
        cb(err, null);
      });
  },

  postPost(postData, cb) {
    const options = {
      method: 'POST',
      uri: API + '/posted/',
      headers: HEADERS,
      body: postData,
      json: true,
    };
    options.body.app_id = APP_ID;


    request(options)
      .then(data => {
        cb(null, data);
      })
      .catch(err => {
        cb(err, null);
      });
  },

  getUsersPosts(username, type, cb) {
    const options = {
      uri: API + '/posted/user/' + username + '/' + type + '/',
      headers: HEADERS,
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

  deletePost(posted_id, cb) {
    const options = {
      method: 'DELETE',
      uri: API + '/posted/' + posted_id,
      headers: HEADERS,
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
      headers: HEADERS,
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

  postBid(bid, cb) {
    const options = {
      method: 'POST',
      uri: API + '/bids/',
      headers: HEADERS,
      body: bid,
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

  getBids(posted_id, cb) {
    const options = {
      uri: API + '/bids/postedid/' + posted_id + '/',
      headers: HEADERS,
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

  deleteBids(posted_id, cb) {
    const options = {
      method: 'DELETE',
      uri: API + '/bids/' + posted_id,
      headers: HEADERS,
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

  postGig(gig, cb) {
    const options = {
      method: 'POST',
      uri: API + '/gigs/',
      headers: HEADERS,
      body: gig,
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

  getGig(gigId, cb) {
    const options = {
      uri: API + '/gigs/getgig/' + gigId,
      headers: HEADERS,
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

  getFreelancerGigs(username, cb) {
    const options = {
      uri: API + '/gigs/freelancer/' + username,
      headers: HEADERS,
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

  getCustomerGigs(username, cb) {
    const options = {
      uri: API + '/gigs/customer/' + username,
      headers: HEADERS,
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

  getAvgRating(username, type, cb) {
    const options = {
      uri: API + '/gigs/getavgrating/' + type + '/' + username,
      headers: HEADERS,
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







