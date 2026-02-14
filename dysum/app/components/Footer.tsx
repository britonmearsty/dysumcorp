export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Dysum</span>
            </div>
            <p className="text-gray-600 max-w-md">
              A modern blog platform where thoughts meet words. Share your
              ideas, stories, and insights with the world.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Platform
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                  href="/"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                  href="/create"
                >
                  Write
                </a>
              </li>
              <li>
                <a
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                  href="/about"
                >
                  About
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Connect
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                  href="#"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                  href="#"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                  href="#"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Dysum. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
