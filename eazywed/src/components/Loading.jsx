

import "../styles/Loading.css"

const Loading = () => {
  return (
    <div className="loading-container loading-overlay">
      <div className="loading-spinner"></div>
      <p className="loading-text">Loading...</p>
    </div>
  )
}

export default Loading