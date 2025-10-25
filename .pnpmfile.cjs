// pnpm configuration file
module.exports = {
  hooks: {
    readPackage(pkg) {
      // Ensure pnpm is used for this project
      if (!pkg.packageManager) {
        pkg.packageManager = 'pnpm@10.19.0'
      }
      return pkg
    }
  }
}
