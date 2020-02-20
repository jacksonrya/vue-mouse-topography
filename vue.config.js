module.exports = {
  devServer: {
    compress: process.env.C9_HOSTNAME ? true : false,
    disableHostCheck: process.env.C9_HOSTNAME ? true : false
  }
}