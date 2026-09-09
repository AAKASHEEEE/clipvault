/* Explicit adapters: errors propagate and UI state changes only after success. */
(function (root) {
  "use strict";
  const C = root.ClipVaultCore;
  const fields = {
    accounts:
      "id,created_at,name,url,platform,niche,status,priority,handle,email,phone,notes,views,subscribers,videos",
    clips:
      "id,created_at,title,account_id,source_url,status,priority,views,views_24h,geo,age_group",
    user_profiles:
      "id,email,display_name,avatar_url,theme,notifications_enabled,default_platform,sort_preference,bio,updated_at",
  };
  const key = "clipvault.enhanced.v1";
  class LocalStore {
    async load() {
      const value = localStorage.getItem(key);
      if (!value) return { version: 1, accounts: [], clips: [] };
      try {
        return C.backup(JSON.parse(value));
      } catch {
        throw Error(
          "Saved data is unreadable. It was not overwritten. Use Settings to export the raw data before resetting.",
        );
      }
    }
    async commit(d) {
      const clean = C.backup(d);
      try {
        localStorage.setItem(key, JSON.stringify(clean));
      } catch {
        throw Error(
          "Browser storage is full or unavailable. Nothing was saved. Export a backup and free some space.",
        );
      }
      return clean;
    }
  }
  class CloudStore {
    constructor(client, user) {
      this.client = client;
      this.user = user;
    }
    async load() {
      const get = async (table) => {
        let all = [],
          offset = 0;
        while (true) {
          const { data, error } = await this.client
            .from(table)
            .select(fields[table])
            .eq("user_id", this.user.id)
            .order("id")
            .range(offset, offset + 499);
          if (error) throw error;
          all.push(...data);
          if (data.length < 500) return all;
          offset += 500;
        }
      };
      const [accounts, clips] = await Promise.all([
        get("accounts"),
        get("clips"),
      ]);
      return C.backup({ version: 1, accounts, clips });
    }
    async getProfile() {
      const { data, error } = await this.client
        .from("user_profiles")
        .select(fields.user_profiles)
        .eq("id", this.user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    }
    async saveProfile(profile) {
      const { data, error } = await this.client
        .from("user_profiles")
        .upsert({ id: this.user.id, email: this.user.email, ...profile, updated_at: new Date().toISOString() })
        .select(fields.user_profiles)
        .single();
      if (error) throw error;
      return data;
    }
    async save(table, row, id) {
      const q = id
        ? this.client
            .from(table)
            .update(row)
            .eq("user_id", this.user.id)
            .eq("id", id)
        : this.client.from(table).insert({ ...row, user_id: this.user.id });
      const { data, error } = await q.select(fields[table]).single();
      if (error) throw error;
      return data;
    }
    async remove(table, id) {
      const { data, error } = await this.client
        .from(table)
        .delete()
        .eq("user_id", this.user.id)
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data?.length)
        throw Error("Record could not be deleted. Reload and try again.");
    }
  }
  root.ClipVaultStorage = { LocalStore, CloudStore, key };
})(globalThis);
