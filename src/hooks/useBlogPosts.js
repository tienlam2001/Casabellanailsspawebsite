import { useEffect, useState } from 'react';
import fallbackPosts from '../data/posts.json';
import { getBlogPosts } from '../utils/adminApi';

const useBlogPosts = () => {
  const [posts, setPosts] = useState(fallbackPosts);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const remote = await getBlogPosts();
        if (!mounted || !Array.isArray(remote) || remote.length === 0) return;
        setPosts(remote);
      } catch {
        // keep fallback
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return posts;
};

export default useBlogPosts;
