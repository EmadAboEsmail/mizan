import { Component } from 'react'
import { RotateCcw, Home } from 'lucide-react'
import { MizanMark } from './BrandIcons.jsx'
import styles from './ErrorBoundary.module.scss'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    if (window.location.hash) {
      window.location.hash = '#/'
    } else {
      window.location.href = '/'
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className={styles.screen} role="alert">
        <div className={styles.card}>
          <div className={styles.badge} aria-hidden="true">
            <MizanMark size={28} accentColor="#F0BC68" />
          </div>
          <h1 className={styles.title}>حدث خطأ غير متوقع</h1>
          <p className={styles.subtitle}>
            بياناتك محفوظة بأمان على جهازك. يمكنك إعادة تحميل الشاشة للمتابعة.
          </p>
          {this.state.error?.message && (
            <code className={styles.code}>{this.state.error.message}</code>
          )}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={this.handleReload}
            >
              <RotateCcw size={16} strokeWidth={2.2} aria-hidden="true" />
              <span>إعادة التحميل</span>
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={this.handleGoHome}
            >
              <Home size={16} strokeWidth={2.1} aria-hidden="true" />
              <span>الرئيسية</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
}
