import {
  useState,
  useEffect,
  useContext,
} from "react";
import {
  Link,
} from "react-router-dom";
import axios from "axios";

import {
  AuthContext,
} from "../context/AuthContext";

import PostFeed from "./PostFeed";
import usePostActions from "../hooks/usePostActions";

const Explore = () => {
  const {
    user,
    setUser,
  } = useContext(AuthContext);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    activeTab,
    setActiveTab,
  ] = useState("FOR_YOU");

  /*
    FOR_YOU
    MOMENTS
    PEOPLE
    RANKINGS
  */

  // ==========================================================
  // MOMENTS
  // ==========================================================

  const [
    momentResults,
    setMomentResults,
  ] = useState([]);

  const [
    momentsLoading,
    setMomentsLoading,
  ] = useState(true);

  // ==========================================================
  // PEOPLE
  // ==========================================================

  const [
    peopleResults,
    setPeopleResults,
  ] = useState([]);

  const [
    peopleLoading,
    setPeopleLoading,
  ] = useState(false);

  // ==========================================================
  // RANKINGS
  // ==========================================================

  const [
    rankingResults,
    setRankingResults,
  ] = useState([]);

  const [
    rankingsLoading,
    setRankingsLoading,
  ] = useState(false);

  // ==========================================================
  // CATEGORIES
  // ==========================================================

  const [
    momentCategories,
    setMomentCategories,
  ] = useState([]);

  const [
    rankingCategories,
    setRankingCategories,
  ] = useState([]);

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("All");

  // ==========================================================
  // FILTER SHEET
  // ==========================================================

  const [
    isFilterOpen,
    setIsFilterOpen,
  ] = useState(false);

  // ==========================================================
  // SEARCH STATE
  // ==========================================================

  const trimmedQuery =
    searchQuery.trim();

  const hasQuery =
    trimmedQuery.length > 0;

  const isSearching =
    hasQuery ||
    activeTab !== "FOR_YOU" &&
    selectedCategory !== "All";

  // ==========================================================
  // FETCH MOMENT CATEGORIES
  // ==========================================================

  useEffect(() => {
    const loadCategories =
      async () => {
        try {
          const [
            momentResponse,
            rankingResponse,
          ] = await Promise.all([
            axios.get(
              `${import.meta.env.VITE_API_URL}/api/posts/categories`
            ),
            axios.get(
              `${import.meta.env.VITE_API_URL}/api/rankings/categories`
            ),
          ]);

          setMomentCategories(
            Array.isArray(
              momentResponse.data
            )
              ? momentResponse.data
              : []
          );

          setRankingCategories(
            Array.isArray(
              rankingResponse.data
            )
              ? rankingResponse.data
              : []
          );
        } catch (error) {
          console.error(
            "Failed to load search categories:",
            error
          );
        }
      };

    loadCategories();
  }, []);

  // ==========================================================
  // LOAD GLOBAL MOMENTS
  // ==========================================================

  const loadGlobalMoments =
    async () => {
      setMomentsLoading(true);

      try {
        const response =
          await axios.get(
            `${import.meta.env.VITE_API_URL}/api/posts`
          );

        setMomentResults(
          Array.isArray(
            response.data
          )
            ? response.data
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load moments:",
          error
        );

        setMomentResults([]);
      } finally {
        setMomentsLoading(false);
      }
    };

  // ==========================================================
  // SEARCH MOMENTS
  // ==========================================================

  const searchMoments =
    async () => {
      setMomentsLoading(true);

      try {
        const response =
          await axios.get(
            `${import.meta.env.VITE_API_URL}/api/posts/search`,
            {
              params: {
                q: trimmedQuery,
                category:
                  selectedCategory ===
                  "All"
                    ? ""
                    : selectedCategory,
              },

              headers:
                user?.token
                  ? {
                      Authorization:
                        `Bearer ${user.token}`,
                    }
                  : undefined,
            }
          );

        setMomentResults(
          Array.isArray(
            response.data
          )
            ? response.data
            : []
        );
      } catch (error) {
        console.error(
          "Moment search failed:",
          error
        );

        setMomentResults([]);
      } finally {
        setMomentsLoading(false);
      }
    };

  // ==========================================================
  // SEARCH PEOPLE
  // ==========================================================

  const searchPeople =
    async () => {
      setPeopleLoading(true);

      try {
        const response =
          await axios.get(
            `${import.meta.env.VITE_API_URL}/api/users/search`,
            {
              params: {
                q: trimmedQuery,
              },
            }
          );

        setPeopleResults(
          Array.isArray(
            response.data
          )
            ? response.data
            : []
        );
      } catch (error) {
        console.error(
          "People search failed:",
          error
        );

        setPeopleResults([]);
      } finally {
        setPeopleLoading(false);
      }
    };

  // ==========================================================
  // SEARCH RANKINGS
  // ==========================================================

  const searchRankings =
    async () => {
      setRankingsLoading(true);

      try {
        const response =
          await axios.get(
            `${import.meta.env.VITE_API_URL}/api/rankings/search`,
            {
              params: {
                q: trimmedQuery,
                category:
                  selectedCategory ===
                  "All"
                    ? ""
                    : selectedCategory,
              },

              headers:
                user?.token
                  ? {
                      Authorization:
                        `Bearer ${user.token}`,
                    }
                  : undefined,
            }
          );

        setRankingResults(
          Array.isArray(
            response.data
          )
            ? response.data
            : []
        );
      } catch (error) {
        console.error(
          "Ranking search failed:",
          error
        );

        setRankingResults([]);
      } finally {
        setRankingsLoading(false);
      }
    };

  // ==========================================================
  // SEARCH EFFECT
  // ==========================================================

  useEffect(() => {
    const delay =
      setTimeout(async () => {
        // ----------------------------------------------------
        // FOR YOU
        // ----------------------------------------------------

        if (activeTab === "FOR_YOU") {
          if (!hasQuery) {
            setSelectedCategory("All");
            await loadGlobalMoments();
          } else {
            await searchMoments();
          }

          return;
        }

        // ----------------------------------------------------
        // PEOPLE
        // ----------------------------------------------------

        if (
          activeTab ===
          "PEOPLE"
        ) {
          if (!hasQuery) {
            setPeopleResults([]);
            setPeopleLoading(false);
            return;
          }

          await searchPeople();
          return;
        }

        // ----------------------------------------------------
        // MOMENTS
        // ----------------------------------------------------

        if (
          activeTab ===
          "MOMENTS"
        ) {
          await searchMoments();
          return;
        }

        // ----------------------------------------------------
        // RANKINGS
        // ----------------------------------------------------

        if (
          activeTab ===
          "RANKINGS"
        ) {
          await searchRankings();
          return;
        }
      }, 300);

    return () =>
      clearTimeout(delay);

  }, [
    activeTab,
    trimmedQuery,
    selectedCategory,
    user?.token,
  ]);

  // ==========================================================
  // POST ACTIONS
  // ==========================================================

  const {
    bookmarkedIds,
    likeLoading,
    bookmarkLoading,
    handleLike,
    handleBookmark,
    handleShare,
  } = usePostActions({
    posts: momentResults,
    setPosts:
      setMomentResults,
    user,
    setUser,
  });

  // ==========================================================
  // TABS
  // ==========================================================

  const tabs = [
    {
      value: "FOR_YOU",
      label: "For You",
    },
    {
      value: "MOMENTS",
      label: "Moments",
    },
    {
      value: "PEOPLE",
      label: "People",
    },
    {
      value: "RANKINGS",
      label: "Rankings",
    },
  ];

  // ==========================================================
  // CLEAR SEARCH
  // ==========================================================

  const clearSearch = () => {
    setSearchQuery("");
    setActiveTab("FOR_YOU");
    setSelectedCategory(
      "All"
    );
    setIsFilterOpen(false);
  };

  // ==========================================================
  // CHANGE TAB
  // ==========================================================

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSelectedCategory(
      "All"
    );
  };

  // ==========================================================
  // FILTERS
  // ==========================================================

  const activeCategories =
    activeTab === "RANKINGS"
      ? rankingCategories
      : momentCategories;

  const showFilters =
    activeTab ===
      "MOMENTS" ||
    activeTab ===
      "RANKINGS";

  // ==========================================================
  // PEOPLE RENDER
  // ==========================================================

  const renderPeople =
    () => {
      if (peopleLoading) {
        return (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-moboxd-accent border-t-transparent rounded-full animate-spin" />
          </div>
        );
      }

      if (
        peopleResults.length ===
        0
      ) {
        return (
          <div className="py-12 text-center">
            <i className="bi bi-person-x text-3xl text-moboxd-muted block mb-3" />

            <p className="text-white font-bold">
              No people found
            </p>

            <p className="text-moboxd-muted text-sm mt-1">
              Try another username or name.
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-2">
          {peopleResults.map(
            (person) => (
              <Link
                key={
                  person._id
                }
                to={`/profile/${person.username}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#17171D] border border-[#2A2A35] hover:border-[#3A3A46] transition-colors"
              >
                <div className="w-11 h-11 rounded-full overflow-hidden bg-[#2A2A35] shrink-0">
                  {person.profilePicture ? (
                    <img
                      src={
                        person.profilePicture
                      }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="bi bi-person-fill text-moboxd-muted" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-white font-bold truncate">
                    {
                      person.displayName ||
                      person.username
                    }
                  </p>

                  <p className="text-moboxd-muted text-sm truncate">
                    @
                    {
                      person.username
                    }
                  </p>
                </div>

                <i className="bi bi-chevron-right text-moboxd-muted" />
              </Link>
            )
          )}
        </div>
      );
    };

  // ==========================================================
  // RANKING RENDER
  // ==========================================================

  const renderRankings =
    () => {
      if (rankingsLoading) {
        return (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-moboxd-accent border-t-transparent rounded-full animate-spin" />
          </div>
        );
      }

      if (
        rankingResults.length ===
        0
      ) {
        return (
          <div className="py-12 text-center">
            <i className="bi bi-trophy text-3xl text-moboxd-muted block mb-3" />

            <p className="text-white font-bold">
              No rankings found
            </p>

            <p className="text-moboxd-muted text-sm mt-1">
              Try another search.
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          {rankingResults.map(
            (ranking) => (
              <Link
                key={
                  ranking._id
                }
                to={`/rankings/${ranking._id}`}
                className="block p-4 rounded-2xl bg-[#17171D] border border-[#2A2A35] hover:border-[#3A3A46] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <p className="text-xs text-moboxd-accent uppercase font-bold tracking-wider mb-2">
                      {
                        ranking.category
                      }
                    </p>

                    <h3 className="text-white font-bold text-lg leading-tight">
                      {
                        ranking.title
                      }
                    </h3>

                    {ranking.description && (
                      <p className="text-moboxd-muted text-sm mt-2 line-clamp-2">
                        {
                          ranking.description
                        }
                      </p>
                    )}

                  </div>

                  <i className="bi bi-chevron-right text-moboxd-muted mt-1" />

                </div>

                <div className="mt-4 pt-3 border-t border-[#2A2A35] flex items-center gap-2">

                  <div className="w-7 h-7 rounded-full overflow-hidden bg-[#2A2A35]">
                    {ranking.creator?.profilePicture ? (
                      <img
                        src={
                          ranking
                            .creator
                            .profilePicture
                        }
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="bi bi-person-fill text-moboxd-muted text-xs" />
                      </div>
                    )}
                  </div>

                  <span className="text-sm text-moboxd-muted">
                    @
                    {
                      ranking
                        .creator
                        ?.username
                    }
                  </span>

                  <span className="ml-auto text-xs text-moboxd-muted">
                    {ranking.items?.length || 0}{" "}
                    items
                  </span>

                </div>
              </Link>
            )
          )}
        </div>
      );
    };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="max-w-[720px] mx-auto px-4 py-6 pb-24">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-white">
          Explore
        </h1>

        <p className="text-moboxd-muted mt-1">
          Discover moments, people and rankings.
        </p>
      </div>

      {/* ====================================================
          SEARCH FIELD
      ==================================================== */}

      <div className="relative mb-4">

        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <i className="bi bi-search text-moboxd-muted text-lg" />
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(
              e.target.value
            )
          }
          placeholder="Search MoBoxd..."
          className="w-full h-14 bg-[#1A1A21] border border-[#2A2A35] rounded-2xl pl-12 pr-12 text-white placeholder:text-moboxd-muted/60 focus:outline-none focus:border-[#3A3A46] focus:ring-2 focus:ring-moboxd-accent/10 transition-all"
        />

        {hasQuery && (
          <button
            type="button"
            onClick={
              clearSearch
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-moboxd-muted hover:text-white hover:bg-[#2A2A35]"
          >
            <i className="bi bi-x-lg text-sm" />
          </button>
        )}

      </div>

      {/* ====================================================
          TAB BAR
      ==================================================== */}

      <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">

        <div className="flex items-center gap-6 min-w-max border-b border-[#2A2A35]">

          {tabs.map(
            (tab) => (
              <button
                key={
                  tab.value
                }
                type="button"
                onClick={() =>
                  changeTab(
                    tab.value
                  )
                }
                className={`relative pb-3 pt-2 text-sm font-bold transition-colors ${
                  activeTab ===
                  tab.value
                    ? "text-white"
                    : "text-moboxd-muted hover:text-white"
                }`}
              >
                {tab.label}

                {activeTab ===
                  tab.value && (
                  <span className="absolute left-0 right-0 bottom-[-1px] h-0.5 bg-moboxd-accent rounded-full" />
                )}
              </button>
            )
          )}

        </div>

      </div>

      {/* ====================================================
          FILTER BUTTON
      ==================================================== */}

      {showFilters && (
        <div className="flex items-center justify-between mt-5 mb-5">

          <button
            type="button"
            onClick={() =>
              setIsFilterOpen(
                true
              )
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1A21] border border-[#2A2A35] text-sm font-bold text-white hover:border-[#3A3A46] transition-colors"
          >
            <i className="bi bi-sliders2" />

            Filter

            {selectedCategory !==
              "All" && (
              <span className="w-2 h-2 rounded-full bg-moboxd-accent" />
            )}
          </button>

          {selectedCategory !==
            "All" && (
            <span className="text-xs text-moboxd-muted">
              {selectedCategory}
            </span>
          )}

        </div>
      )}

      {/* ====================================================
          FOR YOU
      ==================================================== */}

      {activeTab ===
        "FOR_YOU" && (
        <section className="mt-7">

          <div className="flex items-center justify-between mb-5">

            <h2 className="text-xl font-extrabold text-white">
              {hasQuery
                ? `Moments for "${trimmedQuery}"`
                : "Global Moments"}
            </h2>

          </div>

          <PostFeed
            posts={
              momentResults
            }
            loading={
              momentsLoading
            }
            user={user}
            bookmarkedIds={
              bookmarkedIds
            }
            likeLoading={
              likeLoading
            }
            bookmarkLoading={
              bookmarkLoading
            }
            onLike={
              handleLike
            }
            onBookmark={
              handleBookmark
            }
            onShare={
              handleShare
            }
            emptyMessage="No public moments have been posted yet."
          />

        </section>
      )}

      {/* ====================================================
          MOMENTS
      ==================================================== */}

      {activeTab ===
        "MOMENTS" && (
        <section className="mt-7">

          <div className="flex items-center justify-between mb-5">

            <div>
              <h2 className="text-xl font-extrabold text-white">
                Moments
              </h2>

              {hasQuery && (
                <p className="text-sm text-moboxd-muted mt-1">
                  Results for "{trimmedQuery}"
                </p>
              )}
            </div>

          </div>

          <PostFeed
            posts={
              momentResults
            }
            loading={
              momentsLoading
            }
            user={user}
            bookmarkedIds={
              bookmarkedIds
            }
            likeLoading={
              likeLoading
            }
            bookmarkLoading={
              bookmarkLoading
            }
            onLike={
              handleLike
            }
            onBookmark={
              handleBookmark
            }
            onShare={
              handleShare
            }
            emptyMessage={
              hasQuery
                ? "No moments matched your search."
                : "No moments found."
            }
          />

        </section>
      )}

      {/* ====================================================
          PEOPLE
      ==================================================== */}

      {activeTab ===
        "PEOPLE" && (
        <section className="mt-7">

          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-white">
              People
            </h2>

            {hasQuery && (
              <p className="text-sm text-moboxd-muted mt-1">
                Results for "{trimmedQuery}"
              </p>
            )}
          </div>

          {!hasQuery ? (
            <div className="py-14 text-center">
              <i className="bi bi-search text-3xl text-moboxd-muted block mb-3" />

              <p className="text-white font-bold">
                Search for people
              </p>

              <p className="text-moboxd-muted text-sm mt-1">
                Search by name or username.
              </p>
            </div>
          ) : (
            renderPeople()
          )}

        </section>
      )}

      {/* ====================================================
          RANKINGS
      ==================================================== */}

      {activeTab ===
        "RANKINGS" && (
        <section className="mt-7">

          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-white">
              Rankings
            </h2>

            {hasQuery && (
              <p className="text-sm text-moboxd-muted mt-1">
                Results for "{trimmedQuery}"
              </p>
            )}
          </div>

          {renderRankings()}

        </section>
      )}

      {/* ====================================================
          FILTER BOTTOM SHEET
      ==================================================== */}

      {isFilterOpen && (
        <div className="fixed inset-0 z-[100]">

          {/* Backdrop */}

          <button
            type="button"
            aria-label="Close filters"
            onClick={() =>
              setIsFilterOpen(
                false
              )
            }
            className="absolute inset-0 bg-black/70"
          />

          {/* Sheet */}

          <div className="absolute bottom-0 left-0 right-0 bg-[#17171D] border-t border-[#2A2A35] rounded-t-3xl px-5 pt-4 pb-8 max-h-[75vh] overflow-y-auto">

            {/* Handle */}

            <div className="w-10 h-1 rounded-full bg-[#3A3A46] mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">

              <div>
                <h3 className="text-lg font-extrabold text-white">
                  Filter{" "}
                  {activeTab ===
                  "RANKINGS"
                    ? "Rankings"
                    : "Moments"}
                </h3>

                <p className="text-sm text-moboxd-muted mt-1">
                  Choose a category
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsFilterOpen(
                    false
                  )
                }
                className="w-9 h-9 rounded-full bg-[#2A2A35] flex items-center justify-center text-moboxd-muted hover:text-white"
              >
                <i className="bi bi-x-lg text-sm" />
              </button>

            </div>

            <div className="grid grid-cols-2 gap-2">

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(
                    "All"
                  );
                  setIsFilterOpen(
                    false
                  );
                }}
                className={`p-3 rounded-xl border text-left text-sm font-bold transition-colors ${
                  selectedCategory ===
                  "All"
                    ? "bg-moboxd-accent text-black border-moboxd-accent"
                    : "bg-[#1A1A21] text-white border-[#2A2A35]"
                }`}
              >
                All Categories
              </button>

              {activeCategories.map(
                (category) => (
                  <button
                    key={
                      category
                    }
                    type="button"
                    onClick={() => {
                      setSelectedCategory(
                        category
                      );

                      setIsFilterOpen(
                        false
                      );
                    }}
                    className={`p-3 rounded-xl border text-left text-sm font-semibold transition-colors ${
                      selectedCategory ===
                      category
                        ? "bg-moboxd-accent text-black border-moboxd-accent"
                        : "bg-[#1A1A21] text-white border-[#2A2A35]"
                    }`}
                  >
                    {
                      category
                    }
                  </button>
                )
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Explore;