import React from 'react'
import { useLocation } from 'react-router';

const visualizer = () => {
  const location = useLocation();
  const {initialImage, initialRendered, name} = location.state;
  return (
    <section>

      <h1>
        {name || 'Unitled Project'}
      </h1>

    <div className='visualizer'>
      {initialImage && (
        <div className='image-container'>
          <h2>Source Image</h2>
          <img src={initialImage} alt="Visualizer" />
        </div>
      )}
       
    </div>
    </section>
  )
}

export default visualizer