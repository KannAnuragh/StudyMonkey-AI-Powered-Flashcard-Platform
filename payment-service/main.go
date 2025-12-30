package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
)

// PaymentRequest defines the payload for creating a UPI payment
type PaymentRequest struct {
	Amount float64 `json:"amount" binding:"required"` // Amount in INR
	UserID string  `json:"userId" binding:"required"`
}

// PaymentVerification defines the payload for verifying a transaction
type PaymentVerification struct {
	OrderID       string `json:"orderId" binding:"required"`
	TransactionID string `json:"transactionId" binding:"required"`
	UserID        string `json:"userId" binding:"required"`
}

// Payment order storage (in production, use a database)
type PaymentOrder struct {
	ID            string    `json:"id"`
	UserID        string    `json:"userId"`
	Amount        float64   `json:"amount"`
	Status        string    `json:"status"` // pending, verified, failed
	TransactionID string    `json:"transactionId,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
	VerifiedAt    time.Time `json:"verifiedAt,omitempty"`
}

var paymentOrders = make(map[string]*PaymentOrder)

func main() {
	// 1. Load Environment Variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, relying on system env vars")
	}

	upiID := os.Getenv("UPI_ID")
	merchantName := os.Getenv("MERCHANT_NAME")
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if upiID == "" {
		log.Fatal("UPI_ID must be set (e.g., yourname@paytm)")
	}
	if merchantName == "" {
		merchantName = "AI Flashcards"
	}

	// 2. Setup Router
	r := gin.Default()

	// 3. Configure CORS (Allow Frontend to call this)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"}, // Your Next.js URL
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// --- Routes ---

	// POST /create-payment
	// Creates a UPI payment intent and returns UPI string
	r.POST("/create-payment", func(c *gin.Context) {
		var req PaymentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Generate unique order ID
		orderID := uuid.New().String()

		// Create payment order
		order := &PaymentOrder{
			ID:        orderID,
			UserID:    req.UserID,
			Amount:    req.Amount,
			Status:    "pending",
			CreatedAt: time.Now(),
		}
		paymentOrders[orderID] = order

		// Generate UPI payment string
		// Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
		upiString := fmt.Sprintf("upi://pay?pa=%s&pn=%s&am=%.2f&cu=INR&tn=Premium%%20Plan%%20-%20%s",
			upiID, merchantName, req.Amount, orderID)

		log.Printf("Created payment order: %s for user: %s, amount: %.2f", orderID, req.UserID, req.Amount)

		c.JSON(http.StatusOK, gin.H{
			"orderId":      orderID,
			"amount":       req.Amount,
			"upiString":    upiString,
			"upiId":        upiID,
			"merchantName": merchantName,
		})
	})

	// POST /verify-payment
	// Verifies a UPI transaction (user submits transaction ID)
	r.POST("/verify-payment", func(c *gin.Context) {
		var p PaymentVerification
		if err := c.ShouldBindJSON(&p); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Get the order
		order, exists := paymentOrders[p.OrderID]
		if !exists {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}

		// Check if order belongs to user
		if order.UserID != p.UserID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
			return
		}

		// In production, you would:
		// 1. Verify the transaction ID with your bank/UPI provider's API
		// 2. Check if amount matches
		// 3. Ensure transaction is not duplicate

		// For now, we'll mark as verified if transaction ID is provided
		if len(p.TransactionID) > 5 {
			order.Status = "verified"
			order.TransactionID = p.TransactionID
			order.VerifiedAt = time.Now()

			log.Printf("Payment verified: Order %s, Transaction %s", p.OrderID, p.TransactionID)

			// TODO: Update user's premium status in your main database
			// Call your NestJS backend to update user subscription

			c.JSON(http.StatusOK, gin.H{
				"status":  "success",
				"message": "Payment verified successfully",
				"order":   order,
			})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "failure",
				"message": "Invalid transaction ID",
			})
		}
	})

	// GET /payment-status/:orderId
	// Check payment status
	r.GET("/payment-status/:orderId", func(c *gin.Context) {
		orderID := c.Param("orderId")

		order, exists := paymentOrders[orderID]
		if !exists {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"order": order,
		})
	})

	log.Printf("Payment Service running on port %s", port)
	log.Printf("UPI ID: %s", upiID)
	r.Run(":" + port)
}
