hosted on [render](https://dashboard.render.com/web/srv-cura1ll2ng1s73efg940/deploys/dep-cura1lt2ng1s73efg960)

## local https

```bash
mkcert -install
mkdir certs
cd certs
mkcert localhost
```

check end of `index.ts` to see how to enable https

## cookie settings

Have to use sameSite=None in conjunction with Secure; otherwise browsers will ignore the cookie. This is why we need to set up local https.

The reason we need to send cookies cross domains is because our frontend and backend is hosted on different domains.

Finally, remember to include `credentials: 'include'`, on both the backend response and frontend requests.
