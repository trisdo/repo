// =============================================================================
// NGUONC PLUGIN v2.0 - TỐI ƯU CHO OKMATERIALTV
// =============================================================================
// Nguồn: https://phim.nguonc.com
// =============================================================================

// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "nguonc",
        "name": "Phim NguonC",
        "version": "2.0.0",
        "baseUrl": "https://phim.nguonc.com",
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
// URL GENERATION
// =============================================================================

var BASE_API = "https://phim.nguonc.com/api";

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
        if (totalPages === 0 && itemsPerPage > 0) totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages === 0) totalPages = 1;

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: currentPage,
                totalPages: totalPages,
                totalItems: totalItems,
                itemsPerPage: itemsPerPage
            }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 24 } });
    }
}

function parseSearchResponse(apiResponseJson) {
    return parseListResponse(apiResponseJson);
}

function extractGroup(categoryObj, groupName) {
    if (!categoryObj) return "";
    for (var key in categoryObj) {
        if (categoryObj.hasOwnProperty(key)) {
            var group = categoryObj[key];
            if (group && group.group && group.group.name === groupName && group.list && group.list.length > 0) {
                return group.list.map(function (item) { return item.name; }).join(", ");
            }
        }
    }
    return "";
}

function parseMovieDetail(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var movie = response.movie || (response.data && response.data.item) || response.data || {};
        var rawEpisodes = movie.episodes || response.episodes || (response.data && response.data.item && response.data.item.episodes) || [];

        var servers = [];
        if (Array.isArray(rawEpisodes)) {
            rawEpisodes.forEach(function (server) {
                var episodes = [];
                var serverItems = server.items || server.server_data || [];
                if (Array.isArray(serverItems)) {
                    serverItems.forEach(function (ep) {
                        // Ưu tiên lấy m3u8, nếu không có lấy embed
                        var link = ep.m3u8 || ep.link_m3u8 || ep.embed || ep.link_embed || "";
                        if (link) {
                            episodes.push({
                                id: link,
                                name: ep.name || ep.episode_name || "",
                                slug: ep.slug || ep.episode_slug || ""
                            });
                        }
                    });
                }
                if (episodes.length > 0) {
                    servers.push({ 
                        name: server.server_name || server.name || "Server Vip", 
                        episodes: episodes 
                    });
                }
            });
        }

        var extractedYear = extractGroup(movie.category, "Năm");
        var categories = extractGroup(movie.category, "Thể loại");
        var countries = extractGroup(movie.category, "Quốc gia");

        if (!categories && movie.category && Array.isArray(movie.category))
            categories = movie.category.map(function (c) { return c.name || ""; }).join(", ");
        if (!countries && movie.country && Array.isArray(movie.country))
            countries = movie.country.map(function (c) { return c.name || ""; }).join(", ");

        return JSON.stringify({
            id: movie.slug || "",
            title: movie.name || "",
            originName: movie.origin_name || "",
            posterUrl: getImageUrl(movie.thumb_url),
            backdropUrl: getImageUrl(movie.poster_url),
            description: (movie.description || movie.content || "").replace(/<[^>]*>/g, ""),
            year: parseInt(movie.year || extractedYear) || 0,
            rating: parseFloat(movie.view) || 0,
            quality: movie.quality || "",
            duration: movie.time || "",
            servers: servers,
            episode_current: movie.current_episode || movie.episode_current || "",
            episode_total: movie.episode_total || "",
            lang: movie.language || movie.lang || "",
            category: categories,
            country: countries,
            director: movie.director || "",
            casts: movie.casts || movie.actor || "",
            view: parseInt(movie.view) || 0,
            status: movie.status || ""
        });
    } catch (error) {
        return JSON.stringify({ servers: [] });
    }
}

function parseDetailResponse(input) {
    try {
        var videoUrl = "";

        // Trường hợp 1: Chuỗi truyền vào trực tiếp là link m3u8 hoặc HTTP embed
        if (typeof input === "string" && (input.indexOf("http://") === 0 || input.indexOf("https://") === 0)) {
            var m3u8Match = input.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/i);
            videoUrl = m3u8Match ? m3u8Match[0] : input;
        } 
        // Trường hợp 2: Trả về nội dung HTML/JSON chứa luồng m3u8
        else if (typeof input === "string") {
            var m3u8Regex = /file:\s*["']([^"']+\.m3u8[^"']*)["']|source:\s*["']([^"']+\.m3u8[^"']*)["']|src:\s*["']([^"']+\.m3u8[^"']*)["']|["']([^"']+\.m3u8[^"']*)["']/;
            var match = input.match(m3u8Regex);
            videoUrl = match ? (match[1] || match[2] || match[3] || match[4] || "") : "";
        }

        if (videoUrl) {
            return JSON.stringify({
                url: videoUrl,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "
