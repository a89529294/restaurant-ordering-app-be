- get all restaurants by an owner

```sql
SELECT r.*
FROM public.restaurants r
JOIN public.owner_restaurants or ON r.id = or.restaurant_id
WHERE or.owner_id = 'owner-uuid-here';
```

- get all managers and employees of a restaurant

```sql
SELECT u.*
FROM public.users u
WHERE u.restaurant_id = 'restaurant-uuid-here'
  AND u.role IN ('manager', 'waiter');
```
