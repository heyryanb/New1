import { useState } from 'react'
import './App.css'
import { PRIMARY_SPIRITS } from './constants'

function App() {
  // State for form inputs
  const [primarySpirit, setPrimarySpirit] = useState('')
  const [secondary, setSecondary] = useState('')
  const [juices, setJuices] = useState([''])
  const [search, setSearch] = useState('')
  const [recipe, setRecipe] = useState(null)
  const [error, setError] = useState('')
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('favorites')) || []
    } catch {
      return []
    }
  })

  // Add/remove juice fields
  const handleJuiceChange = (idx, value) => {
    setJuices(j => j.map((v, i) => (i === idx ? value : v)))
  }
  const addJuiceField = () => setJuices(j => [...j, ''])
  const removeJuiceField = idx => setJuices(j => j.filter((_, i) => i !== idx))

  // Fetch recipe from TheCocktailDB
  const fetchRecipe = async (e) => {
    e.preventDefault()
    setError('')
    setRecipe(null)
    // Try cache first
    const cacheKey = search.trim().toLowerCase()
    const cached = localStorage.getItem('recipe_' + cacheKey)
    if (cached) {
      setRecipe(JSON.parse(cached))
      return
    }
    try {
      const resp = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(search)}`)
      const data = await resp.json()
      if (!data.drinks) throw new Error('No recipe found')
      // Find best match (simple error correction)
      const found = data.drinks.find(d => d.strDrink.toLowerCase() === cacheKey) || data.drinks[0]
      setRecipe(found)
      localStorage.setItem('recipe_' + cacheKey, JSON.stringify(found))
    } catch (err) {
      setError('No recipe found. Try another name.')
    }
  }

  // Save favorite
  const saveFavorite = () => {
    if (!recipe) return
    const newFavs = [...favorites, recipe]
    setFavorites(newFavs)
    localStorage.setItem('favorites', JSON.stringify(newFavs))
  }

  return (
    <div className="app-container">
      <h1>Cocktail Recipe Finder</h1>
      <div className="input-section">
        <form onSubmit={fetchRecipe}>
          <label>
            Primary Spirit:
            <select value={primarySpirit} onChange={e => setPrimarySpirit(e.target.value)}>
              <option value="">Select...</option>
              {PRIMARY_SPIRITS.map(spirit => (
                <option key={spirit} value={spirit}>{spirit}</option>
              ))}
            </select>
          </label>
          <label>
            Secondary Ingredient:
            <input type="text" value={secondary} onChange={e => setSecondary(e.target.value)} placeholder="e.g. Lillet, Drambuie" />
          </label>
          <label>
            Juices:
            {juices.map((juice, idx) => (
              <div key={idx} className="juice-row">
                <input type="text" value={juice} onChange={e => handleJuiceChange(idx, e.target.value)} placeholder="e.g. lime, orange" />
                {juices.length > 1 && <button type="button" onClick={() => removeJuiceField(idx)}>-</button>}
                {idx === juices.length - 1 && <button type="button" onClick={addJuiceField}>+</button>}
              </div>
            ))}
          </label>
          <label>
            Search by Cocktail Name:
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="e.g. Margarita" />
          </label>
          <button type="submit">Find Recipe</button>
        </form>
      </div>
      <div className="output-section">
        {error && <div className="error">{error}</div>}
        {recipe && (
          <div className="recipe-card">
            <h2>{recipe.strDrink}</h2>
            <img src={recipe.strDrinkThumb} alt={recipe.strDrink} width={200} />
            <ul>
              {Object.keys(recipe)
                .filter(k => k.startsWith('strIngredient') && recipe[k])
                .map((k, i) => (
                  <li key={i}>
                    {recipe[k]} {recipe['strMeasure' + k.replace('strIngredient', '')] || ''}
                  </li>
                ))}
            </ul>
            <p>{recipe.strInstructions}</p>
            <button onClick={saveFavorite}>Save to Favorites</button>
          </div>
        )}
      </div>
      <div className="favorites-section">
        <h3>Favorites</h3>
        {favorites.length === 0 && <p>No favorites yet.</p>}
        <ul>
          {favorites.map((fav, idx) => (
            <li key={idx}>{fav.strDrink}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default App
