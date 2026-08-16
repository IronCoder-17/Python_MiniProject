// controllers/propertiesController.js
const pool = require('../config/db');

// ── helpers ────────────────────────────────────────────────────────────────
const buildFilterQuery = (query) => {
  const conditions = ['1=1'];
  const params = [];

  const { city, category, type, min_price, max_price, bedrooms, status, builder_id,
          min_area, max_area, luxury_rating, featured, search } = query;

  if (city)           { conditions.push('p.city = ?');                         params.push(city); }
  if (category)       { conditions.push('p.category = ?');                     params.push(category); }
  if (type)           { conditions.push('p.property_type = ?');                params.push(type); }
  if (min_price)      { conditions.push('p.price >= ?');                       params.push(Number(min_price)); }
  if (max_price)      { conditions.push('p.price <= ?');                       params.push(Number(max_price)); }
  if (bedrooms)       { conditions.push('p.bedrooms >= ?');                    params.push(Number(bedrooms)); }
  if (status)         { conditions.push('p.possession_status = ?');            params.push(status); }
  if (builder_id)     { conditions.push('p.builder_id = ?');                   params.push(Number(builder_id)); }
  if (min_area)       { conditions.push('p.area_sqft >= ?');                   params.push(Number(min_area)); }
  if (max_area)       { conditions.push('p.area_sqft <= ?');                   params.push(Number(max_area)); }
  if (luxury_rating)  { conditions.push('p.luxury_rating >= ?');               params.push(Number(luxury_rating)); }
  if (featured)       { conditions.push('p.is_featured = 1'); }
  if (search)         { conditions.push('(p.title LIKE ? OR p.location_area LIKE ? OR p.city LIKE ?)');
                        const s = `%${search}%`;
                        params.push(s, s, s); }

  return { where: conditions.join(' AND '), params };
};

// ── GET /api/properties ─────────────────────────────────────────────────
exports.listProperties = async (req, res) => {
  const { where, params } = buildFilterQuery(req.query);
  const page  = Math.max(1, parseInt(req.query.page  || '1'));
  const limit = Math.min(50, parseInt(req.query.limit || '12'));
  const offset = (page - 1) * limit;
  const sort  = ['price_asc', 'price_desc', 'newest', 'area_desc'].includes(req.query.sort)
    ? req.query.sort : 'newest';
  const orderMap = {
    price_asc:  'p.price ASC',
    price_desc: 'p.price DESC',
    newest:     'p.created_at DESC',
    area_desc:  'p.area_sqft DESC',
  };

  const [rows] = await pool.query(
    `SELECT p.*, b.name AS builder_name, b.logo_url AS builder_logo
     FROM properties p
     LEFT JOIN builders b ON b.id = p.builder_id
     WHERE ${where}
     ORDER BY ${orderMap[sort]}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM properties p WHERE ${where}`,
    params
  );

  res.json({ data: rows, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
};

// ── GET /api/properties/featured ────────────────────────────────────────
exports.listFeatured = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, b.name AS builder_name
     FROM properties p LEFT JOIN builders b ON b.id = p.builder_id
     WHERE p.is_featured = 1
     ORDER BY p.luxury_rating DESC, p.created_at DESC LIMIT 8`
  );
  res.json(rows);
};

// ── GET /api/properties/:id ──────────────────────────────────────────────
exports.getProperty = async (req, res) => {
  const [[property]] = await pool.query(
    `SELECT p.*, b.name AS builder_name, b.logo_url AS builder_logo,
            b.years_experience, b.total_projects, b.cities_served, b.rera_registration
     FROM properties p
     LEFT JOIN builders b ON b.id = p.builder_id
     WHERE p.id = ?`,
    [req.params.id]
  );
  if (!property) return res.status(404).json({ error: 'Property not found' });

  const [images]   = await pool.query('SELECT * FROM property_images   WHERE property_id = ? ORDER BY sort_order', [property.id]);
  const [plans]    = await pool.query('SELECT * FROM floor_plans        WHERE property_id = ?', [property.id]);

  // Increment view count asynchronously (fire & forget)
  pool.query('UPDATE properties SET views_count = views_count + 1 WHERE id = ?', [property.id]);

  res.json({ ...property, images, floor_plans: plans });
};

// ── POST /api/properties (admin) ─────────────────────────────────────────
exports.createProperty = async (req, res) => {
  const {
    title, category, property_type, price, price_label, location_area, city, state,
    latitude, longitude, area_sqft, bedrooms = 0, bathrooms = 0, parking = 0,
    possession_status, rera_number, builder_id, luxury_rating = 3, description,
    amenities, hero_image, is_featured = 0,
  } = req.body;

  const [result] = await pool.query(
    `INSERT INTO properties
     (title, category, property_type, price, price_label, location_area, city, state,
      latitude, longitude, area_sqft, bedrooms, bathrooms, parking, possession_status,
      rera_number, builder_id, luxury_rating, description, amenities, hero_image, is_featured)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [title, category, property_type, price, price_label, location_area, city, state,
     latitude, longitude, area_sqft, bedrooms, bathrooms, parking, possession_status,
     rera_number, builder_id, luxury_rating, description, amenities, hero_image, is_featured]
  );
  res.status(201).json({ id: result.insertId, message: 'Property created' });
};

// ── PUT /api/properties/:id (admin) ──────────────────────────────────────
exports.updateProperty = async (req, res) => {
  const allowed = [
    'title','category','property_type','price','price_label','location_area','city','state',
    'latitude','longitude','area_sqft','bedrooms','bathrooms','parking','possession_status',
    'rera_number','builder_id','luxury_rating','description','amenities','hero_image','is_featured',
  ];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid fields provided' });

  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const vals = [...Object.values(updates), req.params.id];
  const [result] = await pool.query(`UPDATE properties SET ${sets} WHERE id = ?`, vals);
  if (!result.affectedRows) return res.status(404).json({ error: 'Property not found' });
  res.json({ message: 'Property updated' });
};

// ── DELETE /api/properties/:id (admin) ───────────────────────────────────
exports.deleteProperty = async (req, res) => {
  const [result] = await pool.query('DELETE FROM properties WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Property not found' });
  res.json({ message: 'Property deleted' });
};

// ── POST /api/properties/:id/images (admin) ───────────────────────────────
exports.addImages = async (req, res) => {
  const { images } = req.body; // [{ image_url, tag, sort_order }]
  if (!Array.isArray(images) || !images.length)
    return res.status(400).json({ error: 'images array required' });

  const vals = images.map(img => [req.params.id, img.image_url, img.tag, img.sort_order || 0]);
  await pool.query('INSERT INTO property_images (property_id, image_url, tag, sort_order) VALUES ?', [vals]);
  res.status(201).json({ message: `${images.length} image(s) added` });
};

// ── GET /api/properties/filters/meta ─────────────────────────────────────
exports.filterMeta = async (req, res) => {
  const [[cities]]   = await pool.query('SELECT GROUP_CONCAT(DISTINCT city) AS c FROM properties');
  const [[cats]]     = await pool.query('SELECT GROUP_CONCAT(DISTINCT category) AS c FROM properties');
  const [[types]]    = await pool.query('SELECT GROUP_CONCAT(DISTINCT property_type) AS c FROM properties');
  const [[prices]]   = await pool.query('SELECT MIN(price) AS min_price, MAX(price) AS max_price FROM properties');
  res.json({
    cities:  cities.c?.split(',') || [],
    categories: cats.c?.split(',') || [],
    types:   types.c?.split(',') || [],
    min_price: prices.min_price,
    max_price: prices.max_price,
  });
};
