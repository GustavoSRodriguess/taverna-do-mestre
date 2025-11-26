package auth

// SetJWTSecretForTests allows other test packages to configure the JWT secret.
func SetJWTSecretForTests(secret string) {
	jwtSecret = []byte(secret)
}
