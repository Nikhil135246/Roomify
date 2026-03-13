import React from 'react'
import { Navigate, useLocation } from 'react-router';

const visualizer = () => {
  const location = useLocation();
  const state = location.state as {
    initialImage?: string;
    initialRendered?: string | null;
    name?: string | null;
  } | null;

  if (!state) {
    return <Navigate to="/" replace />;
  }

  const { initialImage, initialRendered, name } = state;
  return (
    <section>

      <h1>
        {name || 'Untitled Project'}
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