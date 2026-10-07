import React, { useState, useMemo, useEffect } from 'react';
import { GYM_DATA as data } from './data.js';

export default function App() {
  
  // App Navigation State: 'explore' | 'deals' | 'buddies' | 'passport'
  const [activeTab, setActiveTab] = useState('explore');

  // Filter & Search State
  const [selectedLocation, setSelectedLocation] = useState('All Greater Seattle');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuickChip, setActiveQuickChip] = useState('all');
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState([]);
  const [dealsOnly, setDealsOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating'); // 'rating' | 'distance' | 'reviews'

  // User Interactive State
  const [favorites, setFavorites] = useState(['klickway-athletics-slu', 'rain-city-fit-capitol-hill']);
  const [claimedDeals, setClaimedDeals] = useState({});
  const [ironPoints, setIronPoints] = useState(150);
  const [connectedBuddies, setConnectedBuddies] = useState({});
  
  // Modals
  const [selectedGym, setSelectedGym] = useState(null);
  const [dealModalGym, setDealModalGym] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewGymTarget, setReviewGymTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Dynamic Gym List with added reviews
  const [gymsList, setGymsList] = useState(data.gyms);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (gymId, e) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      const exists = prev.includes(gymId);
      const next = exists ? prev.filter(id => id !== gymId) : [...prev, gymId];
      showToast(exists ? 'Removed from saved gyms' : 'Saved to your gym list! ❤️');
      return next;
    });
  };

  const handleClaimDeal = (gym, e) => {
    if (e) e.stopPropagation();
    setDealModalGym(gym);
  };

  const confirmClaimDeal = (gym) => {
    const code = gym.activeDeal?.code || 'PASS2026';
    setClaimedDeals(prev => ({ ...prev, [gym.id]: code }));
    setIronPoints(prev => prev + (gym.activeDeal?.bonusPoints || 50));
    navigator.clipboard?.writeText(code);
    showToast(`Perk claimed! Code ${code} copied to clipboard (+${gym.activeDeal?.bonusPoints || 50} Iron Points) 🎉`);
  };

  const handleConnectBuddy = (buddyId) => {
    setConnectedBuddies(prev => ({ ...prev, [buddyId]: true }));
    showToast('Spotter request sent! Connected with gym buddy 🤝');
  };

  // Filtered Gyms Logic
  const filteredGyms = useMemo(() => {
    return gymsList.filter(gym => {
      // Location / Neighborhood Filter
      if (selectedLocation !== 'All Greater Seattle' && selectedLocation !== 'All Locations') {
        const matchesNeighborhood = gym.neighborhood.toLowerCase() === selectedLocation.toLowerCase() ||
                                   gym.neighborhood.toLowerCase().includes(selectedLocation.toLowerCase()) ||
                                   selectedLocation.toLowerCase().includes(gym.neighborhood.toLowerCase());
        const matchesCity = gym.city.toLowerCase() === selectedLocation.toLowerCase();
        if (!matchesNeighborhood && !matchesCity) {
          return false;
        }
      }
      
      // Keyword search (name, tagline, neighborhood, equipment highlights)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = gym.name.toLowerCase().includes(q);
        const matchesTagline = gym.tagline.toLowerCase().includes(q);
        const matchesCity = gym.city.toLowerCase().includes(q);
        const matchesEquip = gym.equipmentHighlights.some(e => e.toLowerCase().includes(q));
        if (!matchesName && !matchesTagline && !matchesCity && !matchesEquip) {
          return false;
        }
      }

      // Quick Chips
      if (activeQuickChip === 'deals' && !gym.activeDeal) return false;
      if (activeQuickChip === 'chalk' && !gym.equipment.includes('chalk-allowed')) return false;
      if (activeQuickChip === 'platforms' && !gym.equipment.includes('deadlift-platforms')) return false;
      if (activeQuickChip === 'sauna' && !gym.amenities.includes('sauna') && !gym.amenities.includes('cold-plunge')) return false;
      if (activeQuickChip === '24-7' && !gym.amenities.includes('24-7-access')) return false;
      if (activeQuickChip === 'heavy-weights' && !gym.equipment.includes('dumbbells-over-120')) return false;

      // Advanced Filters
      if (dealsOnly && !gym.activeDeal) return false;
      if (selectedVibes.length > 0 && !selectedVibes.some(v => gym.vibes.includes(v))) return false;
      if (selectedEquipment.length > 0 && !selectedEquipment.every(eq => gym.equipment.includes(eq))) return false;
      if (selectedAmenities.length > 0 && !selectedAmenities.every(a => gym.amenities.includes(a))) return false;
      if (selectedTraining.length > 0 && !selectedTraining.every(t => gym.training.includes(t))) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'distance') return a.distanceMiles - b.distanceMiles;
      if (sortBy === 'reviews') return b.reviewCount - a.reviewCount;
      return 0;
    });
  }, [gymsList, selectedLocation, searchQuery, activeQuickChip, selectedVibes, selectedEquipment, selectedAmenities, selectedTraining, dealsOnly, sortBy]);

  // Handle Review Submission
  const handleAddReview = (newReview) => {
    setGymsList(prev => prev.map(gym => {
      if (gym.id === reviewGymTarget.id) {
        const updatedReviews = [newReview, ...gym.reviews];
        const newRating = Number(((gym.rating * gym.reviewCount + newReview.overallRating) / (gym.reviewCount + 1)).toFixed(1));
        return {
          ...gym,
          reviews: updatedReviews,
          rating: newRating,
          reviewCount: gym.reviewCount + 1
        };
      }
      return gym;
    }));
    setIsReviewModalOpen(false);
    showToast('Review submitted! Thank you for supporting the gym community 🌟');
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '9999px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          zIndex: 1000,
          fontWeight: 600,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Main App Bar / Header */}
      <header className="app-header">
        <div className="header-top">
          <div className="brand-section" onClick={() => setActiveTab('explore')}>
            <div className="brand-logo-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>fitness_center</span>
            </div>
            <h1 className="brand-title">Gym<span>Spot</span></h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Location Selector */}
            <div className="location-badge" style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ff5722' }}>location_on</span>
              <span>{selectedLocation}</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_drop_down</span>
              <select 
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  showToast(`Switched location to: ${e.target.value}`);
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              >
                {data.locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Iron Passport Points badge */}
            <button 
              onClick={() => setActiveTab('passport')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                background: '#ffede6',
                border: '1px solid #fed7aa',
                borderRadius: '9999px',
                color: '#c2410c',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>military_tech</span>
              <span>{ironPoints} pts</span>
            </button>
          </div>
        </div>

        {/* Search Input Bar (Visible in Explore View) */}
        {activeTab === 'explore' && (
          <div className="search-wrapper">
            <div className="search-input-box">
              <span className="material-symbols-outlined" style={{ color: '#64748b' }}>search</span>
              <input 
                type="text" 
                placeholder="Search gyms, calibrated plates, sauna, turf lanes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Filter Chip Carousel */}
        {activeTab === 'explore' && (
          <div className="filter-chip-bar">
            <div 
              className={`chip ${activeQuickChip === 'all' ? 'active' : ''}`}
              onClick={() => setActiveQuickChip('all')}
            >
              All Facilities
            </div>
            <div 
              className={`chip accent ${activeQuickChip === 'deals' ? 'active' : ''}`}
              onClick={() => setActiveQuickChip(activeQuickChip === 'deals' ? 'all' : 'deals')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>local_offer</span>
              Deals & Day Passes
            </div>
            <div 
              className={`chip ${activeQuickChip === 'chalk' ? 'active' : ''}`}
              onClick={() => setActiveQuickChip(activeQuickChip === 'chalk' ? 'all' : 'chalk')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>blur_on</span>
              Chalk Allowed
            </div>
            <div 
              className={`chip ${activeQuickChip === 'platforms' ? 'active' : ''}`}
              onClick={() => setActiveQuickChip(activeQuickChip === 'platforms' ? 'all' : 'platforms')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>inventory_2</span>
              Deadlift Platforms
            </div>
            <div 
              className={`chip ${activeQuickChip === 'sauna' ? 'active' : ''}`}
              onClick={() => setActiveQuickChip(activeQuickChip === 'sauna' ? 'all' : 'sauna')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>hot_tub</span>
              Sauna & Plunge
            </div>
            <div 
              className={`chip ${activeQuickChip === '24-7' ? 'active' : ''}`}
              onClick={() => setActiveQuickChip(activeQuickChip === '24-7' ? 'all' : '24-7')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>lock_open</span>
              24/7 Keycard
            </div>
            <div 
              className={`chip ${activeQuickChip === 'heavy-weights' ? 'active' : ''}`}
              onClick={() => setActiveQuickChip(activeQuickChip === 'heavy-weights' ? 'all' : 'heavy-weights')}
            >
              Dumbbells &gt; 120 lbs
            </div>
            <div 
              className="chip chip-filter-btn"
              onClick={() => setIsFilterModalOpen(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>tune</span>
              More Filters
            </div>
          </div>
        )}
      </header>

      {/* Main Tab Content */}
      <main className="main-content">
        {/* =========================================================
            TAB 1: EXPLORE / SEARCH
           ========================================================= */}
        {activeTab === 'explore' && (
          <div>
            <div className="results-meta">
              <span className="results-count">
                Showing <strong>{filteredGyms.length}</strong> fitness facilities
                {selectedLocation !== 'All Greater Seattle' && selectedLocation !== 'All Locations' && ` in ${selectedLocation}`}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Sort:</span>
                <select 
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="rating">Highest Rated</option>
                  <option value="distance">Nearest Distance</option>
                  <option value="reviews">Most Reviewed</option>
                </select>
              </div>
            </div>

            {filteredGyms.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                border: '1px dashed #cbd5e1'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#94a3b8', marginBottom: '12px' }}>search_off</span>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Gyms Match Your Specific Criteria</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
                  Try resetting your filters or expanding your search location.
                </p>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setActiveQuickChip('all');
                    setSelectedLocation('All Locations');
                    setSearchQuery('');
                    setSelectedVibes([]);
                    setSelectedEquipment([]);
                    setSelectedAmenities([]);
                    setSelectedTraining([]);
                    setDealsOnly(false);
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="gym-grid">
                {filteredGyms.map(gym => {
                  const isFavorited = favorites.includes(gym.id);
                  const isClaimed = !!claimedDeals[gym.id];

                  return (
                    <article 
                      key={gym.id} 
                      className="gym-card"
                      onClick={() => setSelectedGym(gym)}
                    >
                      {/* Media Header */}
                      <div className="card-media-wrapper">
                        <img 
                          src={gym.images[0]} 
                          alt={gym.name} 
                          className="card-image"
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80';
                          }}
                        />
                        
                        {/* Day Pass or Match Tag */}
                        {gym.dayPassAvailable ? (
                          <div className="match-badge high" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>confirmation_number</span>
                            Day Pass ${gym.dayPassPrice ? gym.dayPassPrice.toFixed(0) : 'Available'}
                          </div>
                        ) : gym.matchPercentage ? (
                          <div className="match-badge high">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>bolt</span>
                            {gym.matchPercentage}% Match
                          </div>
                        ) : null}

                        {/* Favorite Button */}
                        <button 
                          className={`card-favorite-btn ${isFavorited ? 'favorited' : ''}`}
                          onClick={(e) => toggleFavorite(gym.id, e)}
                          aria-label="Save gym"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                            {isFavorited ? 'favorite' : 'favorite_border'}
                          </span>
                        </button>

                        {/* Overlay Badges */}
                        <div className="badge-row">
                          {gym.badges.includes('verified-operator') && (
                            <span className="badge-tag operator">
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
                              Verified Operator
                            </span>
                          )}
                          {gym.badges.includes('chalk-friendly') && (
                            <span className="badge-tag chalk">
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>blur_on</span>
                              Chalk Friendly
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="card-body">
                        <div className="card-header-line">
                          <h3 className="gym-name">{gym.name}</h3>
                          <span className="price-tier">{gym.priceLevel}</span>
                        </div>

                        <p className="gym-tagline">{gym.tagline}</p>

                        <div className="card-meta-line">
                          <span className="rating-badge">
                            <span className="material-symbols-outlined star-icon" style={{ fontSize: '16px' }}>star</span>
                            {gym.rating}
                            <span className="review-count">({gym.reviewCount})</span>
                          </span>

                          <span className="distance-badge">
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>near_me</span>
                            {gym.distanceMiles} mi • {gym.neighborhood}
                          </span>
                        </div>

                        {/* Equipment Highlights Pills */}
                        <div className="equipment-pill-list">
                          {gym.equipmentHighlights.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="equipment-mini-pill">
                              {item}
                            </span>
                          ))}
                        </div>

                        {/* Active Promotion Banner */}
                        {gym.activeDeal && (
                          <div className="card-deal-banner">
                            <div className="deal-info">
                              <span className="deal-title">{gym.activeDeal.title}</span>
                              <span className="deal-sub">
                                {isClaimed ? `Claimed! Code: ${claimedDeals[gym.id]}` : 'Tap to claim digital pass'}
                              </span>
                            </div>
                            <button 
                              className="deal-action-btn"
                              onClick={(e) => handleClaimDeal(gym, e)}
                            >
                              {isClaimed ? 'View Code' : 'Claim Perk'}
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 2: EXCLUSIVE DEALS & DAY PASSES
           ========================================================= */}
        {activeTab === 'deals' && (
          <div>
            <div className="section-banner">
              <h2>Exclusive Gym Passes & Member Perks</h2>
              <p>Special introductory rates, free day passes, and contrast therapy sessions negotiated directly with verified gym operators.</p>
            </div>

            {gymsList.filter(g => g.activeDeal).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', margin: '20px 0' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#94a3b8', marginBottom: '12px', display: 'block' }}>local_offer</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>No Active Promotional Deals</h3>
                <p style={{ color: '#64748b', maxWidth: '500px', margin: '0 auto 20px', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  All deals on GymSpot represent real verified partnerships with local gym operators. Explore Seattle gym listings to view current drop-in rates and day passes.
                </p>
                <button 
                  className="btn-primary" 
                  onClick={() => setActiveTab('explore')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>explore</span>
                  Browse Greater Seattle Gyms
                </button>
              </div>
            ) : (
              <div className="gym-grid">
                {gymsList.filter(g => g.activeDeal).map(gym => {
                  const deal = gym.activeDeal;
                  const isClaimed = !!claimedDeals[gym.id];

                  return (
                    <div key={gym.id} className="gym-card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <img 
                          src={gym.images[0]} 
                          alt={gym.name} 
                          style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80';
                          }}
                        />
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{gym.name}</h3>
                          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{gym.city} • {gym.neighborhood}</p>
                        </div>
                      </div>

                      <div style={{
                        backgroundColor: '#fff7ed',
                        border: '1px dashed #f97316',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c2410c', fontWeight: 800, marginBottom: '6px' }}>
                          <span className="material-symbols-outlined">local_offer</span>
                          {deal.title}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#7c2d12', marginBottom: '12px' }}>{deal.description}</p>
                        <div style={{ fontSize: '0.75rem', color: '#9a3412', fontWeight: 600 }}>
                          Bonus: +{deal.bonusPoints} Iron Passport Points upon claiming
                        </div>
                      </div>

                      <button 
                        className="btn-primary" 
                        style={{ width: '100%' }}
                        onClick={() => handleClaimDeal(gym)}
                      >
                        {isClaimed ? `Claimed (Code: ${claimedDeals[gym.id]})` : 'Claim Exclusive Pass'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 3: FIND A GYM BUDDY (SOCIAL COMMUNITY)
           ========================================================= */}
        {activeTab === 'buddies' && (
          <div>
            <div className="section-banner">
              <h2>Find a Workout Partner or Spotter</h2>
              <p>Connect with lifters who train at your home gym, match your schedule, and share your training goals.</p>
            </div>

            {(!data.gymBuddies || data.gymBuddies.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', margin: '20px 0' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#94a3b8', marginBottom: '12px', display: 'block' }}>group_off</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>No Gym Buddy Listings Yet</h3>
                <p style={{ color: '#64748b', maxWidth: '500px', margin: '0 auto 20px', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Connect with real powerlifters, bodybuilders, and fitness enthusiasts in Greater Seattle. Profile creation will unlock once community accounts open.
                </p>
                <button 
                  className="btn-primary" 
                  onClick={() => setActiveTab('explore')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>explore</span>
                  Find A Gym Near You
                </button>
              </div>
            ) : (
              <div className="gym-grid">
                {data.gymBuddies.map(buddy => {
                  const isConnected = !!connectedBuddies[buddy.id];

                  return (
                    <div key={buddy.id} className="gym-card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                        <img 
                          src={buddy.avatar} 
                          alt={buddy.name} 
                          style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{buddy.name}</h3>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            background: '#e0f2fe', 
                            color: '#0369a1', 
                            padding: '3px 8px', 
                            borderRadius: '9999px', 
                            fontWeight: 600 
                          }}>
                            {buddy.lookingFor}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 600, marginBottom: '4px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#ff5722' }}>fitness_center</span>
                          Trains at: {buddy.homeGymName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                          {buddy.preferredTimes}
                        </div>
                      </div>

                      <p style={{
                        backgroundColor: '#f8fafc',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: '#334155',
                        fontStyle: 'italic',
                        marginBottom: '16px'
                      }}>
                        "{buddy.goals}"
                      </p>

                      <button 
                        className={isConnected ? "btn-secondary" : "btn-primary"}
                        style={{ width: '100%' }}
                        onClick={() => handleConnectBuddy(buddy.id)}
                      >
                        {isConnected ? 'Request Sent ✓' : 'Connect & Spot'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 4: IRON PASSPORT (RETENTION & GAMIFICATION)
           ========================================================= */}
        {activeTab === 'passport' && (
          <div>
            <div className="section-banner">
              <h2>Your Iron Passport & Badges</h2>
              <p>Track your lifetime gym visits, collect unlockable badges, and redeem points for gym pro-shop discounts.</p>
            </div>

            {/* Stats Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>3</span>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Gyms Visited</p>
              </div>
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>2</span>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Metro Cities</p>
              </div>
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ff5722' }}>{ironPoints}</span>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Iron Reward Points</p>
              </div>
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7' }}>{favorites.length}</span>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Saved Favorites</p>
              </div>
            </div>

            {/* Achievement Badges */}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Unlockable Achievements</h3>
            <div className="gym-grid" style={{ marginBottom: '32px' }}>
              {data.passportAchievements.map(badge => (
                <div key={badge.id} style={{
                  backgroundColor: '#ffffff',
                  padding: '20px',
                  borderRadius: '16px',
                  border: badge.unlocked ? '1px solid #fed7aa' : '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: badge.unlocked ? '#ffede6' : '#f1f5f9',
                    color: badge.unlocked ? '#ea580c' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>{badge.icon}</span>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                      {badge.title} {badge.unlocked && '🏆'}
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '8px' }}>{badge.description}</p>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: badge.unlocked ? '#c2410c' : '#64748b',
                      background: badge.unlocked ? '#ffedd5' : '#f8fafc',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {badge.progress}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* =========================================================
          MODAL 1: FULL GYM DETAIL VIEW
         ========================================================= */}
      {selectedGym && (
        <div className="modal-overlay" onClick={() => setSelectedGym(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Header Image */}
            <div className="modal-header-image">
              <img 
                src={selectedGym.images[0]} 
                alt={selectedGym.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80';
                }}
              />
              <button 
                className="modal-close-btn"
                onClick={() => setSelectedGym(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="modal-content-body">
              {/* Badges Bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {selectedGym.badges.includes('verified-operator') && (
                  <span className="badge-tag operator">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
                    Verified Operator
                  </span>
                )}
                {selectedGym.badges.includes('chalk-friendly') && (
                  <span className="badge-tag chalk">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>blur_on</span>
                    Chalk & Drop Friendly
                  </span>
                )}
                {selectedGym.badges.includes('gear-certified') && (
                  <span className="badge-tag gear">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified_user</span>
                    Gear Certified
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                {selectedGym.name}
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '12px' }}>
                {selectedGym.address} • {selectedGym.priceLevel}
              </p>

              {/* Verified Contact & Facilities Metadata */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '16px', fontSize: '0.85rem' }}>
                {selectedGym.phone && (
                  <a 
                    href={`tel:${selectedGym.phone.replace(/[^0-9+]/g, '')}`} 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ff5722', textDecoration: 'none', fontWeight: 600 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call</span>
                    {selectedGym.phone}
                  </a>
                )}
                {selectedGym.website && (
                  <a 
                    href={selectedGym.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>language</span>
                    Official Website
                  </a>
                )}
                {selectedGym.facilitySize && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>straighten</span>
                    {selectedGym.facilitySize}
                  </span>
                )}
              </div>

              {selectedGym.pricingNotes && (
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.85rem', color: '#334155' }}>
                  <strong style={{ color: '#0f172a' }}>Pricing & Drop-in Notes:</strong> {selectedGym.pricingNotes}
                </div>
              )}

              {/* Vibe & Community Breakdown (Progress Bars or Community Note) */}
              <div className="vibe-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    Vibe & Community Breakdown
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {selectedGym.vibeMetrics ? `Based on ${selectedGym.reviewCount} member reviews` : 'Awaiting member ratings'}
                  </span>
                </div>

                {selectedGym.vibeMetrics ? (
                  <div className="vibe-meter-row">
                    <div className="vibe-meter-item">
                      <div className="vibe-meter-labels">
                        <span>Cleanliness & Locker Rooms</span>
                        <span>{selectedGym.vibeMetrics.cleanliness} / 5.0</span>
                      </div>
                      <div className="vibe-progress-bar">
                        <div className="vibe-progress-fill fill-clean" style={{ width: `${(selectedGym.vibeMetrics.cleanliness / 5) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="vibe-meter-item">
                      <div className="vibe-meter-labels">
                        <span>Equipment Quality & Maintenance</span>
                        <span>{selectedGym.vibeMetrics.equipmentQuality} / 5.0</span>
                      </div>
                      <div className="vibe-progress-bar">
                        <div className="vibe-progress-fill fill-equipment" style={{ width: `${(selectedGym.vibeMetrics.equipmentQuality / 5) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="vibe-meter-item">
                      <div className="vibe-meter-labels">
                        <span>Peak Hours Space (Congestion)</span>
                        <span>{selectedGym.vibeMetrics.crowdLevel > 3.8 ? 'Spacious' : 'Moderate'}</span>
                      </div>
                      <div className="vibe-progress-bar">
                        <div className="vibe-progress-fill fill-crowd" style={{ width: `${(selectedGym.vibeMetrics.crowdLevel / 5) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '10px', marginTop: '10px', fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#94a3b8' }}>insights</span>
                    <span>Cleanliness, equipment quality, and crowd flow scores will compute dynamically as local lifters submit verified ratings.</span>
                  </div>
                )}
              </div>

              {/* Equipment Highlights Matrix */}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Verified Equipment & Facilities
              </h4>
              <div className="equipment-matrix">
                {selectedGym.equipmentHighlights.map((gear, idx) => (
                  <div key={idx} className="equipment-matrix-item">
                    <span className="check-icon">✓</span>
                    <span>{gear}</span>
                  </div>
                ))}
              </div>

              {/* Active Deal Card */}
              {selectedGym.activeDeal && (
                <div style={{
                  backgroundColor: '#fff7ed',
                  border: '1px dashed #f97316',
                  borderRadius: '16px',
                  padding: '16px',
                  margin: '20px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div>
                    <h4 style={{ color: '#c2410c', fontWeight: 800, fontSize: '0.95rem' }}>{selectedGym.activeDeal.title}</h4>
                    <p style={{ color: '#9a3412', fontSize: '0.8rem' }}>{selectedGym.activeDeal.description}</p>
                  </div>
                  <button 
                    className="btn-primary" 
                    onClick={() => handleClaimDeal(selectedGym)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Claim Pass
                  </button>
                </div>
              )}

              {/* Hours */}
              <div style={{ fontSize: '0.85rem', color: '#64748b', margin: '16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>schedule</span>
                <span>{selectedGym.openHours}</span>
              </div>

              {/* Reviews Section */}
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                    Member Reviews ({selectedGym.reviews?.length || 0})
                  </h4>
                  <button 
                    className="btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    onClick={() => {
                      setReviewGymTarget(selectedGym);
                      setIsReviewModalOpen(true);
                    }}
                  >
                    Write a Review
                  </button>
                </div>

                {selectedGym.reviews && selectedGym.reviews.length > 0 ? (
                  <div className="reviews-list">
                    {selectedGym.reviews.map(rev => (
                      <div key={rev.id} className="review-item">
                        <div className="review-header">
                          <span className="review-author">
                            {rev.authorName}
                            {rev.authorBadges?.includes('verified-regular') && (
                              <span className="reviewer-badge">Verified Regular</span>
                            )}
                            {rev.authorBadges?.includes('powerlifter') && (
                              <span className="reviewer-badge" style={{ backgroundColor: '#ffedd5', color: '#c2410c' }}>Powerlifter</span>
                            )}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{rev.date}</span>
                        </div>
                        <p className="review-discipline">{rev.authorDiscipline}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '4px 0' }}>
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="material-symbols-outlined" style={{ fontSize: '15px', color: i < rev.overallRating ? '#f59e0b' : '#cbd5e1' }}>
                              star
                            </span>
                          ))}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#334155', marginTop: '6px' }}>{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>rate_review</span>
                    <p style={{ fontWeight: 600, color: '#334155', marginBottom: '4px', fontSize: '0.9rem' }}>No community reviews yet</p>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', maxWidth: '400px', margin: '0 auto 12px' }}>
                      Have you trained at {selectedGym.name}? Share your insights on squat racks, chalk tolerance, and crowd levels!
                    </p>
                    <button 
                      className="btn-primary"
                      style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                      onClick={() => {
                        setReviewGymTarget(selectedGym);
                        setIsReviewModalOpen(true);
                      }}
                    >
                      Be the First to Review
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Sticky Action Bar */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                {selectedGym.website ? (
                  <a 
                    href={selectedGym.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary" 
                    style={{ flex: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <span className="material-symbols-outlined">public</span>
                    Visit Website
                  </a>
                ) : (
                  <button 
                    className="btn-primary" 
                    style={{ flex: 1 }}
                    onClick={() => handleClaimDeal(selectedGym)}
                  >
                    <span className="material-symbols-outlined">confirmation_number</span>
                    Get Day Pass (${selectedGym.dayPassPrice || 15})
                  </button>
                )}
                {selectedGym.phone ? (
                  <a 
                    href={`tel:${selectedGym.phone.replace(/[^0-9+]/g, '')}`}
                    className="btn-secondary" 
                    style={{ flex: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <span className="material-symbols-outlined">call</span>
                    Call Gym
                  </a>
                ) : (
                  <button 
                    className="btn-secondary" 
                    style={{ flex: 1 }}
                    onClick={() => {
                      setSelectedGym(null);
                      setActiveTab('explore');
                    }}
                  >
                    <span className="material-symbols-outlined">close</span>
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: CLAIM PROMO / DIGITAL PASS
         ========================================================= */}
      {dealModalGym && (
        <div className="modal-overlay" onClick={() => setDealModalGym(null)}>
          <div className="modal-card" style={{ maxWidth: '440px', padding: '24px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#ffede6',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>local_activity</span>
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>
              Claim Your Exclusive Pass
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
              {dealModalGym.name} • Valid for 24 hours from activation
            </p>

            {/* Ticket Card */}
            <div style={{
              border: '2px dashed #f97316',
              backgroundColor: '#fff7ed',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <p style={{ fontSize: '0.8rem', color: '#9a3412', fontWeight: 600, marginBottom: '8px' }}>
                PROMO & DOOR ENTRY CODE
              </p>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                letterSpacing: '2px',
                color: '#c2410c',
                backgroundColor: '#ffffff',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #fed7aa',
                userSelect: 'all'
              }}>
                {dealModalGym.activeDeal?.code || 'GYMSPOT2026'}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#ea580c', marginTop: '8px', fontWeight: 600 }}>
                +{dealModalGym.activeDeal?.bonusPoints || 50} Iron Passport Points Awarded
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn-primary" 
                style={{ flex: 1 }}
                onClick={() => {
                  confirmClaimDeal(dealModalGym);
                  setDealModalGym(null);
                }}
              >
                Copy & Redeem
              </button>
              <button 
                className="btn-secondary"
                onClick={() => setDealModalGym(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: ADVANCED MULTI-FACET FILTER DRAWER
         ========================================================= */}
      {isFilterModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFilterModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '580px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Refine Search Filters</h3>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Gym Vibe */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: '#0f172a' }}>Gym Culture & Vibe</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {data.filterOptions.vibes.map(vibe => {
                  const active = selectedVibes.includes(vibe.id);
                  return (
                    <div 
                      key={vibe.id}
                      className={`chip ${active ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedVibes(prev => active ? prev.filter(x => x !== vibe.id) : [...prev, vibe.id]);
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{vibe.icon}</span>
                      {vibe.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Equipment */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: '#0f172a' }}>Specific Equipment Requirements</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {data.filterOptions.equipment.map(eq => {
                  const active = selectedEquipment.includes(eq.id);
                  return (
                    <div 
                      key={eq.id}
                      className={`chip ${active ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedEquipment(prev => active ? prev.filter(x => x !== eq.id) : [...prev, eq.id]);
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{eq.icon}</span>
                      {eq.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Amenities */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: '#0f172a' }}>Amenities & Recovery</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {data.filterOptions.amenities.map(am => {
                  const active = selectedAmenities.includes(am.id);
                  return (
                    <div 
                      key={am.id}
                      className={`chip ${active ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedAmenities(prev => active ? prev.filter(x => x !== am.id) : [...prev, am.id]);
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{am.icon}</span>
                      {am.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '24px' }}>
              <button 
                className="btn-secondary"
                onClick={() => {
                  setSelectedVibes([]);
                  setSelectedEquipment([]);
                  setSelectedAmenities([]);
                  setSelectedTraining([]);
                  setDealsOnly(false);
                }}
              >
                Clear All
              </button>
              <button 
                className="btn-primary" 
                style={{ flex: 1 }}
                onClick={() => setIsFilterModalOpen(false)}
              >
                Apply Filters ({filteredGyms.length} Matches)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: WRITE A REVIEW
         ========================================================= */}
      {isReviewModalOpen && reviewGymTarget && (
        <ReviewModal 
          gym={reviewGymTarget} 
          onClose={() => setIsReviewModalOpen(false)} 
          onSubmit={handleAddReview}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => setActiveTab('explore')}
        >
          <span className="material-symbols-outlined">explore</span>
          <span>Explore</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'deals' ? 'active' : ''}`}
          onClick={() => setActiveTab('deals')}
        >
          <span className="material-symbols-outlined">local_offer</span>
          <span>Deals</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'buddies' ? 'active' : ''}`}
          onClick={() => setActiveTab('buddies')}
        >
          <span className="material-symbols-outlined">group</span>
          <span>Buddies</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'passport' ? 'active' : ''}`}
          onClick={() => setActiveTab('passport')}
        >
          <span className="material-symbols-outlined">badge</span>
          <span>Passport</span>
        </button>
      </nav>
    </div>
  );
}

// Review Submission Subcomponent
function ReviewModal({ gym, onClose, onSubmit }) {
  const [authorName, setAuthorName] = useState('');
  const [authorDiscipline, setAuthorDiscipline] = useState('Powerlifter');
  const [overallRating, setOverallRating] = useState(5);
  const [cleanliness, setCleanliness] = useState(5);
  const [equipmentQuality, setEquipmentQuality] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    onSubmit({
      id: 'rev-' + Date.now(),
      authorName: authorName.trim() || 'Anonymous Lifter',
      authorDiscipline,
      authorBadges: ['verified-regular'],
      overallRating: Number(overallRating),
      subRatings: {
        cleanliness: Number(cleanliness),
        equipmentQuality: Number(equipmentQuality),
        cultureVibe: 5,
        crowdLevel: 4
      },
      comment,
      date: 'Just now',
      helpfulCount: 0
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '500px', padding: '24px' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>Review {gym.name}</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
          Share authentic equipment feedback with fellow lifters.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Your Name</label>
            <input 
              type="text" 
              className="search-input-box" 
              style={{ width: '100%' }}
              placeholder="e.g. Alex M." 
              value={authorName} 
              onChange={e => setAuthorName(e.target.value)} 
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Training Discipline</label>
            <select 
              className="sort-select" 
              style={{ width: '100%' }}
              value={authorDiscipline}
              onChange={e => setAuthorDiscipline(e.target.value)}
            >
              <option value="Competitive Powerlifter">Competitive Powerlifter</option>
              <option value="Bodybuilder">Bodybuilder</option>
              <option value="CrossFit & Functional">CrossFit & Functional</option>
              <option value="Casual Lifter / General Fitness">Casual Lifter / General Fitness</option>
              <option value="Olympic Weightlifter">Olympic Weightlifter</option>
            </select>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Overall Rating (1 - 5 Stars)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setOverallRating(star)}
                  style={{
                    background: star <= overallRating ? '#ffedd5' : '#f1f5f9',
                    border: star <= overallRating ? '1px solid #f97316' : '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: star <= overallRating ? '#c2410c' : '#64748b'
                  }}
                >
                  ★ {star}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Equipment & Experience Notes</label>
            <textarea 
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontFamily: 'inherit',
                fontSize: '0.9rem'
              }}
              placeholder="How are the squat racks, chalk availability, barbell knurling, and crowd levels at peak hours?"
              value={comment}
              onChange={e => setComment(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              Post Review
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
