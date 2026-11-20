import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, type ThemeConfig } from 'antd'
import '@ant-design/v5-patch-for-react-19'
import './index.css'
import App from './App.tsx'

// Ant Design tokens taken from the crl-light theme block in index.css.
const theme: ThemeConfig = {
  token: {
    borderRadius: 6,
    colorBgLayout: '#f7f7f9',
    colorBorder: '#e3e3e8',
    colorPrimary: '#7a3fe4',
    colorText: '#17171c',
    colorTextSecondary: '#62626b',
    fontFamily: 'Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    fontFamilyCode: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider theme={theme}>
      <App />
    </ConfigProvider>
  </StrictMode>,
)
