const CustomerService = require('../services/customerServices');
const CustomerCommunication = require('../services/customerCommunication');
const AuthenticationService = require('../services/authService');

const {GenerateSignature, GenerateRefreshToken, verifyAccessToken, verifyRefreshToken} = require('../utils')
//const  UserAuth = require('./middlewares/auth');



exports.customer = (app) => {
    
    
    const communication = new CustomerCommunication();
    const service = new CustomerService()
    const auth = new AuthenticationService();
    // To listen
    communication.SubscribeEvents();

    app.post('/register', async (req,res,next) => {
        const { email, phone, password, first_name, last_name } = req.body;
        const { data } = await auth.SignUp({ email, phone, password, first_name, last_name }); 
        res.json(data);

    });

    app.post('/refresh-token',  async (req,res,next) => {

        try {
            const {refreshToken} = req.body;
            const {userId} = await verifyRefreshToken(refreshToken);
            console.log(userId)
            const accessToken = await GenerateSignature(userId)
            const refToken = await GenerateRefreshToken(userId)

            res.json({accessToken, refToken});
        } catch (error) {
            next(error);
        }
    });
    app.post('/login',  async (req,res,next) => {
        
        const { email, password } = req.body;
        const { data } = await auth.SignIn({ email, password});
        res.json(data);

    });

    app.post('/address', async (req,res,next) => {
        
        const { _id } = req.user;


        const { street, postalCode, city,country } = req.body;

        const { data } = await service.AddNewAddress( _id ,{ street, postalCode, city,country});

        res.json(data);

    });
     

    app.get('/profile', verifyAccessToken, async (req,res,next) => {


        try {
            const  _id  = req.payload.userId;
            const { data } = await service.GetProfile( _id );
            return res.status(200).json(data);
        } catch (error) {
            console.log(error)
        return res.status(404).json({ error });
        }
    });
    app.get('/wallet', verifyAccessToken, async (req,res,next) => {


        try {
            const  _id  = req.payload.userId;
            const { data } = await service.getUserWallet( _id );
            return res.status(200).json(data);
        } catch (error) {
            console.log(error)
        return res.status(404).json({ error });
        }
    }); 

    app.get('/cart', async (req, res, next) => {
        try {
            const _id = 1; // Not sure what this is used for, you can remove it if not needed
            const { data }  = await service.getUserCart(1);
            return res.status(200).json(data);
        } catch (error) {
        return res.status(404).json({ error });
        }
    });
    
    
    app.post('/checkout', verifyAccessToken, async (req,res,next) => {
        const { product_list, total_original_price, total_final_price,shipping_address, shipping_method_id} = req.body;
        const user_id = req.payload.userId
        const {data} = await communication.checkOutOrder(user_id, product_list, total_original_price, total_final_price, shipping_address, shipping_method_id);
        return res.json(data);;
    });
    app.get('/checkout-concurrency', async (req,res,next) => {
        const reqBody = {
            "user_id":1,
            "product_list": [
                    {
                        "product_item_id": 1,
                        "quantity": 4
                    },
                    {
                        "product_item_id": 3,
                        "quantity": 10
                    }
                ],
            "payment_type": "Wallet",
            "total_final_price": 2400
        }
        const {user_id, product_list, total_original_price, total_final_price} = reqBody;
        const {data} = await communication.checkOutOrder(user_id, product_list, total_original_price, total_final_price);
        return res.json(data);;
    });
};