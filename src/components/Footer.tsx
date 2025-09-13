function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Traffic Tacos</h3>
            <p className="text-sm text-gray-600">
              빠르고 안정적인 티켓 예매 서비스
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">서비스</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-primary-600 transition-colors">이용약관</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">개인정보처리방침</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">고객지원</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-primary-600 transition-colors">문의하기</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">공지사항</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; 2024 Traffic Tacos. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
