//
// =============================================================================
// NGUONC PLUGIN v2.0 - TỐI ƯU
// =============================================================================
// Nguồn: https://phim.nguonc.com
// Tối ưu cho OKMaterialTV / SmartTube
// Thay đổi: Fix extractGroup() parsing category/country, hardcoded fallback data
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
// URL GENERATION - TỐI ƯU
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

        // TRANG CHỦ: dùng API phim-moi-cap-nhat làm nội dung mặc định
        if (slug === 'home') {
            return BASE_API + "/films/phim-moi-cap-nhat?page=" + page;
        }

        // Phim Mới Cập Nhật (không filter)
        if (slug === 'phim-moi-cap-nhat' && !filters.category && !filters.country && !filters.year) {
            return BASE_API + "/films/phim-moi-cap-nhat?page=" + page;
        }

        // Filter ưu tiên
        if (filters.category)
            return BASE_API + "/films/the-loai/" + filters.category + "?page=" + page + "&sort=" + sort;
        if (filters.country)
            return BASE_API + "/films/quoc-gia/" + filters.country + "?page=" + page + "&sort=" + sort;
        if (filters.year)
            return BASE_API + "/films/nam-phat-hanh/" + filters.year + "?page=" + page + "&sort=" + sort;

        // Slug-based
        if (/^\d{4}$/.test(slug))
            return BASE_API + "/films/nam-phat-hanh/" + slug + "?page=" + page + "&sort=" + sort;
        if (LIST_SLUGS.indexOf(slug) >= 0)
            return BASE_API + "/films/danh-sach/" + slug + "?page=" + page + "&sort=" + sort;
        if (COUNTRY_SLUGS.indexOf(slug) >= 0)
            return BASE_API + "/films/quoc-gia/" + slug + "?page=" + page + "&sort=" + sort;

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
    if (urlOrSlug && (urlOrSlug.indexOf("http") === 0 || urlOrSlug.indexOf("https") === 0))
        return urlOrSlug;
    return BASE_API + "/film/" + urlOrSlug;
}

// =============================================================================
// PARSERS - TỐI ƯU
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

/**
 * FIX: Giải nén category/country từ cấu trúc group đặc biệt của NguonC.
 * Cấu trúc: { "1": { group: { name: "Thể loại" }, list: [...] }, "2": { group: { name: "Quốc gia" }, list: [...] } }
 */
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
        var movie = response.movie || response.data?.item || response.data || {};
        var rawEpisodes = movie.episodes || response.episodes || response.data?.item?.episodes || [];

        var servers = [];
        if (Array.isArray(rawEpisodes)) {
            rawEpisodes.forEach(function (server) {
                var episodes = [];
                var serverItems = server.items || server.server_data || [];
                if (Array.isArray(serverItems)) {
                    serverItems.forEach(function (ep) {
                        var embed = ep.embed || ep.link_embed || "";
                        var m3u8 = ep.m3u8 || ep.link_m3u8 || "";
                        var link = embed || m3u8;
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
                    servers.push({ name: server.server_name || server.name || "Server", episodes: episodes });
                }
            });
        }

        // FIX: Giải nén từ cấu trúc group đặc biệt
        var extractedYear = extractGroup(movie.category, "Năm");
        var categories = extractGroup(movie.category, "Thể loại");
        var countries = extractGroup(movie.category, "Quốc gia");

        // Fallback: nếu không tìm thấy trong group, thử field trực tiếp
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
        return "null";
    }
}

function parseDetailResponse(html) {
    try {
        var m3u8Regex = /file:\s*["']([^"']+\.m3u8[^"']*)["']|source:\s*["']([^"']+\.m3u8[^"']*)["']|src:\s*["']([^"']+\.m3u8[^"']*)["']|["']([^"']+\.m3u8[^"']*)["']/;
        var match = html.match(m3u8Regex);
        var m3u8 = match ? (match[1] || match[2] || match[3] || match[4] || "") : "";

        if (m3u8) {
            return JSON.stringify({
                url: m3u8,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Referer": "https://embed.streamc.xyz/"
                },
                subtitles: []
            });
        }
        return "{}";
    } catch (error) {
        return "{}";
    }
}

/**
 * FIX: NguonC không có API categories động, trả về hardcoded.
 */
function parseCategoriesResponse(apiResponseJson) {
    var genres = [
        { name: "Hành Động", slug: "hanh-dong" },
        { name: "Phiêu Lưu", slug: "phieu-luu" },
        { name: "Hoạt Hình", slug: "hoat-hinh" },
        { name: "Hài", slug: "phim-hai" },
        { name: "Hình Sự", slug: "hinh-su" },
        { name: "Tài Liệu", slug: "tai-lieu" },
        { name: "Chính Kịch", slug: "chinh-kich" },
        { name: "Gia Đình", slug: "gia-dinh" },
        { name: "Giả Tưởng", slug: "gia-tuong" },
        { name: "Lịch Sử", slug: "lich-su" },
        { name: "Kinh Dị", slug: "kinh-di" },
        { name: "Nhạc", slug: "phim-nhac" },
        { name: "Bí Ẩn", slug: "bi-an" },
        { name: "Lãng Mạn", slug: "lang-man" },
        { name: "Khoa Học Viễn Tưởng", slug: "khoa-hoc-vien-tuong" },
        { name: "Gây Cấn", slug: "gay-can" },
        { name: "Chiến Tranh", slug: "chien-tranh" },
        { name: "Tâm Lý", slug: "tam-ly" },
        { name: "Tình Cảm", slug: "tinh-cam" },
        { name: "Cổ Trang", slug: "co-trang" },
        { name: "Miền Tây", slug: "mien-tay" },
        { name: "Phim 18+", slug: "phim-18" }
    ];
    return JSON.stringify(genres);
}

/**
 * FIX: NguonC không có API countries động, trả về hardcoded.
 */
function parseCountriesResponse(apiResponseJson) {
    var countries = [
        { name: "Âu Mỹ", value: "au-my" },
        { name: "Anh", value: "anh" },
        { name: "Trung Quốc", value: "trung-quoc" },
        { name: "Indonesia", value: "indonesia" },
        { name: "Việt Nam", value: "viet-nam" },
        { name: "Pháp", value: "phap" },
        { name: "Hồng Kông", value: "hong-kong" },
        { name: "Hàn Quốc", value: "han-quoc" },
        { name: "Nhật Bản", value: "nhat-ban" },
        { name: "Thái Lan", value: "thai-lan" },
        { name: "Đài Loan", value: "dai-loan" },
        { name: "Nga", value: "nga" },
        { name: "Hà Lan", value: "ha-lan" },
        { name: "Philippines", value: "philippines" },
        { name: "Ấn Độ", value: "an-do" },
        { name: "Quốc gia khác", value: "quoc-gia-khac" }
    ];
    return JSON.stringify(countries);
}

/**
 * FIX: NguonC không có API years động, trả về hardcoded.
 */
function parseYearsResponse(apiResponseJson) {
    var currentYear = new Date().getFullYear();
    var years = [];
    for (var y = currentYear; y >= 2004; y--) {
        years.push({ name: String(y), value: String(y) });
    }
    return JSON.stringify(years);
}

// =============================================================================
// HELPERS
// =============================================================================

function getImageUrl(path) {
    if (!path) return "";
    if (path.indexOf("http") === 0 || path.indexOf("https") === 0) return path;
    return "https://img.phimapi.com/" + path;
}
