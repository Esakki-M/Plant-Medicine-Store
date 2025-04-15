// Featured Products Data
const featuredProducts = [
    {
        id: 1,
        name: "Ashwagandha Root Extract",
        description: "Organic stress-relief supplement that promotes balance and wellness",
        price: 599.99,
        stock: 25,
        category_id: 1,
        image: "https://images.unsplash.com/photo-1611485988300-b7ef6a1766fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        is_featured: true
    },
    {
        id: 2,
        name: "Turmeric Curcumin Capsules",
        description: "Anti-inflammatory supplement with enhanced absorption formula",
        price: 499.99,
        stock: 30,
        category_id: 1,
        image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        is_featured: true
    },
    {
        id: 3,
        name: "Moringa Leaf Powder",
        description: "Nutrient-rich superfood powder for daily health maintenance",
        price: 349.99,
        stock: 15,
        category_id: 2,
        image: "https://images.unsplash.com/photo-1611485988300-b7ef6a1766fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        is_featured: true
    },
    {
        id: 4,
        name: "Holy Basil (Tulsi) Extract",
        description: "Adaptogenic herb that supports immune function and stress response",
        price: 449.99,
        stock: 20,
        category_id: 1,
        image: "https://images.unsplash.com/photo-1611485988300-b7ef6a1766fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        is_featured: true
    },
    {
        id: 5,
        name: "Neem Leaf Extract",
        description: "Traditional herb for skin health and immune support",
        price: 399.99,
        stock: 18,
        category_id: 3,
        image: "https://images.unsplash.com/photo-1611485988300-b7ef6a1766fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        is_featured: true
    },
    {
        id: 6,
        name: "Triphala Herbal Blend",
        description: "Ancient Ayurvedic formula for digestive health and detoxification",
        price: 549.99,
        stock: 12,
        category_id: 2,
        image: "https://images.unsplash.com/photo-1611485988300-b7ef6a1766fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        is_featured: true
    },
    {
        id: 7,
        name: "Brahmi (Bacopa) Supplement",
        description: "Cognitive enhancer that supports memory and brain function",
        price: 649.99,
        stock: 10,
        category_id: 1,
        image: "https://images.unsplash.com/photo-1611485988300-b7ef6a1766fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        is_featured: true
    },
    {
        id: 8,
        name: "Amla (Indian Gooseberry) Powder",
        description: "Vitamin C-rich superfood for immunity and skin health",
        price: 299.99,
        stock: 22,
        category_id: 2,
        image: "https://images.unsplash.com/photo-1611485988300-b7ef6a1766fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        is_featured: true
    }
];

// Categories Data
const categories = [
    {
        id: 1,
        name: "Herbal Supplements",
        productCount: 15,
        image: "https://images.unsplash.com/photo-1611485988300-b7ef6a1766fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 2,
        name: "Ayurvedic Powders",
        productCount: 8,
        image: "https://images.unsplash.com/photo-1611485988300-b7ef6a1766fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 3,
        name: "Medicinal Oils",
        productCount: 10,
        image: "https://images.unsplash.com/photo-1611485988300-b7ef6a1766fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 4,
        name: "Herbal Teas",
        productCount: 12,
        image: "https://images.unsplash.com/photo-1611485988300-b7ef6a1766fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    }
];

// Testimonials Data
const testimonials = [
    {
        id: 1,
        name: "Priya Sharma",
        rating: 5,
        avatar: "https://randomuser.me/api/portraits/women/12.jpg",
        comment: "The Ashwagandha supplements have significantly improved my sleep quality and reduced my stress levels. Highly recommended!"
    },
    {
        id: 2,
        name: "Rajesh Kumar",
        rating: 4,
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        comment: "I've been using the Turmeric Curcumin capsules for my joint pain, and I've noticed a remarkable difference in just a few weeks."
    },
    {
        id: 3,
        name: "Ananya Patel",
        rating: 5,
        avatar: "https://randomuser.me/api/portraits/women/45.jpg",
        comment: "The Moringa powder has become an essential part of my daily smoothie. I feel more energetic and healthier than ever!"
    }
];