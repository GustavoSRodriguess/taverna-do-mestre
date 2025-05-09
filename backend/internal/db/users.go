package db

func (p *PostgresDB) GetUserByID(ctx context.Context, id int) (*models.User, error) {
	user := &models.User{}
	query := `SELECT * FROM users WHERE id = $1`
	err := p.DB.GetContext(ctx, user, query, id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user by ID: %w", err)
	}
	return user, nil
}

func (p *PostgresDB) GetUserByUsername(ctx context.Context, username string) (*models.User, error) {
	user := &models.User{}
	query := `SELECT * FROM users WHERE username = $1`
	err := p.DB.GetContext(ctx, user, query, username)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user by username: %w", err)
	}
	return user, nil
}

func (p *PostgresDB) GetUserByEmailAndPwd(ctx context.Context, email, password string) (*models.User, error) {
	user := &models.User{}
	query := `SELECT * FROM users WHERE email = $1 AND password = $2`
	err := p.DB.GetContext(ctx, user, query, email, password)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user by email and password: %w", err)
	}
	return user, nil
}

func (p *PostgresDB) CreateUser(ctx context.Context, user *models.User) error {
	query := `INSERT INTO users (username, email, password, created_at, updated_at, admin) VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := p.DB.ExecContext(ctx, query, user.Username, user.Email, user.Password, user.CreatedAt, user.UpdatedAt, user.Admin)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}

func (p *PostgresDB) UpdateUser(ctx context.Context, user *models.User) error {
	query := `UPDATE users SET username = $1, email = $2, password = $3, updated_at = $4, admin = $5 WHERE id = $6`
	_, err := p.DB.ExecContext(ctx, query, user.Username, user.Email, user.Password, user.UpdatedAt, user.Admin, user.ID)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}
	return nil
}

func (p *PostgresDB) DeleteUser(ctx context.Context, id int) error {
	query := `DELETE FROM users WHERE id = $1`
	_, err := p.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	return nil
}

func (p *PostgresDB) GetAllUsers(ctx context.Context) ([]*models.User, error) {
	users := []*models.User{}
	query := `SELECT * FROM users`
	err := p.DB.SelectContext(ctx, &users, query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch all users: %w", err)
	}
	return users, nil
}
