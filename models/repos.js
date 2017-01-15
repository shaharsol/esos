module.exports = {
  add: function(db,userID,repo,price,hook,callback){
    var repos = db.get('repos');
    repos.insert({
      user_id: userID,
      full_name: repo.full_name,
      html_url: repo.html_url,
      price: price,
      hook_id: hook.id,
      created_at: new Date()
    },function(err,repo){
      callback(err,repo)
    })
  },
  remove: function(db,userID,fullName,callback){
    var repos = db.get('repos');
    repos.remove({
      user_id: userID,
      full_name: fullName
    },function(err){
      callback(err)
    })
  },
  getUserRepos: function(db,userID,callback){
    var repos = db.get('repos');
    repos.find({user_id: userID},function(err,repos){
      callback(err,repos)
    })
  },
  getByUserAndFullName: function(db,userID,fullName,callback){
    var repos = db.get('repos');
    repos.findOne({user_id: userID, full_name: fullName},function(err,repo){
      callback(err,repo)
    })
  },
  getByFullName: function(db,fullName,callback){
    var repos = db.get('repos');
    repos.findOne({full_name: fullName},function(err,repo){
      callback(err,repo)
    })
  },
  get: function(db,repoID,callback){
    var repos = db.get('repos');
    repos.findOne({_id: repoID},function(err,repo){
      callback(err,repo)
    })
  }


}