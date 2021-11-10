const omit = (key, obj) =>{
    const { [key]: omitted, ...rest } = obj;
    return rest;
  }

  module.exports = {omit}