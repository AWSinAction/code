// fsm = Finite State Machine

module.exports = function(imageId, imageVersion, imageState) {
  function failed(reason, cb) {
    cb(); // TODO
  }
  var machine = {
    "created": {
      "uploaded": function(cb) {
        cb(); // TODO
      },
      "failed": failed
    },
    "uploaded": {
      "processed": function(cb) {
        cb(); // TODO
      },
      "failed": failed
    },
    "processed": {
      "shared": function(cb) {
        cb(); // TODO
      },
      "failed": failed
    },
    "shared": {
      "done": function(cb) {
        cb(); // TODO
      },
      "failed": failed
    },
    "done": {
    },
    "failed": {
    }
  };
  function transition(state, params, cb) {
    if (machine[imageState] === undefined) {
      cb(new Error("imageState not found"));
    } else if (machine[imageState][state] === undefined) {
      cb(new Error("transition not allowed"));
    } else {
      var args = params.concat([cb]);
      machine[imageState][state].apply(this, args);
    }
  }
  return {
    "uploaded": function(cb) {
      transition('uploaded', [], cb);
    },
    "processed": function(cb) {
      transition('processed', [], cb);
    },
    "shared": function(cb) {
      transition('shared', [], cb);
    },
    "done": function(cb) {
      transition('done', [], cb);
    },
    "failed": function(reason, cb) {
      transition('failed', [reason], cb);
    }
  };
};