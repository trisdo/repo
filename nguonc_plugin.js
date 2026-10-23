// =============================================================================
// NGUONC PLUGIN v2.0 - TỐI ƯU CHO OKMATERIALTV (CUSTOM DOMAIN)
// =============================================================================
// Nguồn: https://nguonc.taisaovayem.com
// =============================================================================

// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "nguonc",
        "name": "Phim NguonC",
        "version": "2.0.1",
        "baseUrl": "https://nguonc.taisaovayem.com",
        "iconUrl": "https://raw.githubusercontent.com/youngbi/repo/main/plugins/nguonC.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "embed"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'home', title: '🏠 Trang Chủ', type: 'Grid', path: 'home' },
        { slug: 'phim-moi-cap-nhat', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'phim-moi-cap-nhat' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'tv-shows', title: 'TV Shows', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'the-loai' },
        { slug: 'phim-dang-chieu', title: 'Phim Đang Chiếu', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim lẻ', slug: 'phim-le' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'TV Shows', slug: 'tv-shows' },
        { name: 'Hoạt hình', slug: 'hoat-hinh' },
        { name: 'Phim đang chiếu', slug: 'phim-dang-chieu' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới cập nhật', value: 'modified.time' },
            { name: 'Mới nhất', value: 'new' },
            { name: 'Lượt xem', value: 'view' }
        ]
    });
}

// =============================================================================
// URL GENERATION (DÙNG DOMAIN MỚI)
// =============================================================================

var BASE_API = "https://nguonc.taisaovayem.com/api";

var LIST_SLUGS = ['phim-le', 'phim-bo', 'phim-dang-chieu', 'tv-shows', 'subteam'];
var COUNTRY_SLUGS = [
    'au-my', 'anh', 'trung-quoc', 'indonesia', 'viet-nam',
    'phap', 'hong-kong', 'han-quoc', 'nhat-ban', 'thai-lan',
    'dai-loan', 'nga', 'ha-lan', 'philippines', 'an-do', 'quoc-gia-khac'
];

function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        var sort = filters.sort || "modified.time";

        if (slug === 'home' || (slug === 'phim-moi-cap-nhat' && !filters.category && !filters.country && !filters.year)) {
            return BASE_API + "/films/phim-moi-cap-nhat?page=" + page;
        }

        if (filters.category) return BASE_API + "/films/the-loai/" + filters.category + "?page=" + page + "&sort=" + sort;
        if (filters.country) return BASE_API + "/films/quoc-gia/" + filters.country + "?page=" + page + "&sort=" + sort;
        if (filters.year) return BASE_API + "/films/nam-phat-hanh/" + filters.year + "?page=" + page + "&sort=" + sort;

        if (/^\d{4}$/.test(slug)) return BASE_API + "/films/nam-phat-hanh/" + slug + "?page=" + page + "&sort=" + sort;
        if (LIST_SLUGS.indexOf(slug) >= 0) return BASE_API + "/films/danh-sach/" + slug + "?page=" + page + "&sort=" + sort;
        if (COUNTRY_SLUGS.indexOf(slug) >= 0) return BASE_API + "/films/quoc-gia/" + slug + "?page=" + page + "&sort=" + sort;

        return BASE_API + "/films/the-loai/" + slug + "?page=" + page + "&sort=" + sort;
    } catch (e) {
        return BASE_API + "/films/phim-moi-cap-nhat?page=1";
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        return BASE_API + "/films/search?keyword=" + encodeURIComponent(keyword) + "&page=" + page;
    } catch (e) {
        return BASE_API + "/films/search?keyword=" + encodeURIComponent(keyword);
    }
}

function getUrlDetail(slug) {
    if (slug && (slug.indexOf("http") === 0 || slug.indexOf("https") === 0)) return slug;
    return BASE_API + "/film/" + slug;
}

function getUrlCategories() { return BASE_API + "/the-loai"; }
function getUrlCountries() { return BASE_API + "/quoc-gia"; }
function getUrlYears() { return BASE_API + "/nam-phat-hanh"; }

function getUrlEpisodePlayer(urlOrSlug) {
    if (urlOrSlug && (urlOrSlug.indexOf("http") === 0 || urlOrSlug.indexOf("https") === 0)) {
        return urlOrSlug;
    }
    return BASE_API + "/film/" + urlOrSlug;
}

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var data = response.data || {};
        var items = [];

        if (Array.isArray(data)) items = data;
        else if (Array.isArray(response.items)) items = response.items;
        else if (data.items && Array.isArray(data.items)) items = data.items;

        var paginate = response.paginate || response.pagination || (data.params && data.params.pagination) || {};

        var movies = items.map(function (item) {
            return {
                id: item.slug || "",
                title: item.name || "",
                posterUrl: getImageUrl(item.thumb_url),
                backdropUrl: getImageUrl(item.poster_url),
                year: item.year || 0,
                quality: item.quality || "",
                episode_current: item.current_episode || item.episode_current || "",
                lang: item.language || item.lang || ""
            };
        });

        var currentPage = paginate.current_page || paginate.currentPage || 1;
        var totalItems = paginate.total_items || paginate.totalItems || 0;
        var itemsPerPage = paginate.items_per_page || paginate.itemsPerPage || paginate.totalItemsPerPage || 24;
        var totalPages = paginate.total_page || paginate.totalPages || 0;
