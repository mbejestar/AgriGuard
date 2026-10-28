
import { useState } from 'react'

const crops = [
  {
    name: 'Tomato',
    summary:
      'Tomato is a warm-season fruit crop widely grown in home gardens and farms. It produces nutritious fruits used in salads, sauces and cooking. Tomatoes grow best in warm conditions with plenty of sunlight.',
    funFact:
      'Tomatoes are botanically fruits, not vegetables! They belong to the same plant family as potatoes and peppers.',
    water: 'Water consistently near the roots. Avoid wet leaves.',
    sunlight: '6–8 hours of direct sunlight daily.',
    soil: 'Well-drained, fertile soil.',
    diseases: [
      {
        name: 'Early Blight',
        symptoms: 'Brown spots with concentric rings on older leaves.',
        care: 'Remove badly affected leaves, improve airflow and avoid overhead watering.'
      },
      {
        name: 'Late Blight',
        symptoms: 'Dark, water-soaked lesions that may spread rapidly.',
        care: 'Remove infected material carefully and seek local agricultural advice promptly.'
      }
    ]
  },
  {
    name: 'Maize',
    summary:
      'Maize is one of South Africa’s most important staple crops. It is grown for its grains, which are used to make maize meal, animal feed and many food products. Maize requires warm weather, fertile soil and sufficient moisture.',
    funFact:
      'A maize cob usually has an even number of kernel rows! Maize is also known as corn in many parts of the world.',
    water: 'Maintain consistent soil moisture, especially during flowering.',
    sunlight: 'Full sunlight.',
    soil: 'Fertile, well-drained soil.',
    diseases: [
      {
        name: 'Northern Corn Leaf Blight',
        symptoms: 'Long, grey-green or tan lesions on leaves.',
        care: 'Use resistant varieties where available and manage infected crop residue.'
      },
      {
        name: 'Common Rust',
        symptoms: 'Small reddish-brown pustules on leaves.',
        care: 'Monitor affected plants and consult local extension guidance about control.'
      }
    ]
  },
  {
    name: 'Potato',
    summary:
      'Potato is a food crop grown for its underground tubers. It is an important source of carbohydrates and is used in many meals. Potatoes grow best in loose, well-drained soil and relatively cool conditions.',
    funFact:
      'The potato we eat is not actually a root! It is a modified underground stem called a tuber, which stores nutrients for the plant.',
    water: 'Keep soil evenly moist without waterlogging.',
    sunlight: 'Full sunlight.',
    soil: 'Loose, well-drained soil.',
    diseases: [
      {
        name: 'Early Blight',
        symptoms: 'Dark spots with concentric rings, often on older leaves.',
        care: 'Rotate crops, remove infected debris and monitor disease spread.'
      },
      {
        name: 'Late Blight',
        symptoms: 'Water-soaked brown lesions, sometimes with white growth underneath.',
        care: 'Act quickly, avoid moving infected plant material and seek agricultural advice.'
      }
    ]
  },
  {
    name: 'Cabbage',
    summary:
      'Cabbage is a leafy vegetable belonging to the Brassica family. It is commonly grown for its tightly packed leaves and is used in salads, stews and other meals. Cabbage prefers fertile soil, consistent moisture and cooler growing conditions.',
    funFact:
      'Cabbage, broccoli, cauliflower and kale all come from the same plant species, Brassica oleracea, but have been selectively bred for different characteristics!',
    water: 'Water regularly to maintain even soil moisture.',
    sunlight: 'Full sun, with protection from extreme heat where needed.',
    soil: 'Fertile, well-drained soil rich in organic matter.',
    diseases: [
      {
        name: 'Black Rot',
        symptoms: 'Yellow V-shaped lesions spreading inward from leaf edges.',
        care: 'Use clean seed, rotate crops and remove infected crop residue.'
      },
      {
        name: 'Alternaria Leaf Spot',
        symptoms: 'Dark circular spots, sometimes with concentric rings.',
        care: 'Improve airflow, avoid overhead watering and remove infected debris.'
      }
    ]
  }
]

function PlantGuide() {
  const [selectedCrop, setSelectedCrop] = useState('Tomato')
  const [view, setView] = useState('care')

  const crop = crops.find(item => item.name === selectedCrop)

  return (
    <section className="plant-guide">
      <h2>Plant Health Guide</h2>
      <p>
        Explore crop information, care tips, fun facts
        and common plant diseases.
      </p>

      <div className="guide-controls">
        <button
          type="button"
          onClick={() => setView('care')}
          aria-pressed={view === 'care'}
        >
          Care Guide
        </button>

        <button
          type="button"
          onClick={() => setView('diseases')}
          aria-pressed={view === 'diseases'}
        >
          Diagnose Common Diseases
        </button>
      </div>

      <label htmlFor="crop-select">
        Choose your crop
      </label>

      <select
        id="crop-select"
        value={selectedCrop}
        onChange={event => setSelectedCrop(event.target.value)}
      >
        {crops.map(item => (
          <option key={item.name} value={item.name}>
            {item.name}
          </option>
        ))}
      </select>

      {view === 'care' ? (
        <div className="guide-card">
          <h3>{crop.name} Care Guide</h3>

          <h4>🌱 Plant Summary</h4>
          <p>{crop.summary}</p>

          <h4>💡 Fun Fact</h4>
          <p>{crop.funFact}</p>

          <h4>🌿 Growing Requirements</h4>

          <p>
            <strong>Water:</strong> {crop.water}
          </p>

          <p>
            <strong>Sunlight:</strong> {crop.sunlight}
          </p>

          <p>
            <strong>Soil:</strong> {crop.soil}
          </p>
        </div>
      ) : (
        <div className="disease-list">
          <h3>Common {crop.name} Diseases</h3>

          {crop.diseases.map(disease => (
            <article
              className="guide-card"
              key={disease.name}
            >
              <h4>{disease.name}</h4>

              <p>
                <strong>Symptoms:</strong>{' '}
                {disease.symptoms}
              </p>

              <p>
                <strong>Recommended care:</strong>{' '}
                {disease.care}
              </p>
            </article>
          ))}
        </div>
      )}

      <p className="guide-disclaimer">
        This guide provides general educational information,
        not a confirmed diagnosis. Consult a local agricultural
        specialist for serious or rapidly spreading crop diseases.
      </p>
    </section>
  )
}

export default PlantGuide
